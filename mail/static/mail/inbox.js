document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

});


function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#get-mail').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  document.querySelector('#compose-form').onsubmit = function() {
    // Send a POST request to the application's API
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: document.querySelector('#compose-recipients').value,
          subject: document.querySelector('#compose-subject').value,
          body: document.querySelector('#compose-body').value
      })
    })
    .then(response => response.json())
    .then(result => {
        console.log(result); 
        // Load the sent mailbox
        load_mailbox('sent');
    });
    return false;
  }
  }


function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#get-mail').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Send a GET request to the API
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      console.log(emails);
      emails.forEach(email => {
        // Create a new div element and assign it a class of 'mail' and a dataset attribute
        const mail = document.createElement('div');
        mail.classList.add('mail');
        mail.dataset.attributeId = email.id;
        console.log(email.id);

        // Display div content depending on the mailbox in which it appears
        mail.innerHTML = mailbox === 'sent' ? 
                                            ` <p><strong>To:</strong> ${email.recipients}</p>
                                              <p><strong>Subject:</strong> ${email.subject}</p>
                                              <p><strong>Timestamp:</strong> ${email.timestamp}</p> ` 
                                              :
                                            ` <p><strong>From:</strong> ${email.sender}</p>
                                              <p><strong>Subject:</strong> ${email.subject}</p>
                                              <p><strong>Timestamp:</strong> ${email.timestamp}</p> ` ;
        
        // Assign classes to mails, excluding sent mails, to signify read and unread
        if (email.read) {
          if (mailbox !== 'sent') {
            mail.classList.add('read-mail');
          }
        } else {
          mail.classList.add('unread-mail');
        }                                       

      mail.addEventListener('click', display_mail);
      document.querySelector('#emails-view').append(mail);
  });   
      });
}


// Display the content of a specific mail
function display_mail() {

  // Display the 'get-mail' div and hide the others
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#get-mail').style.display = 'block';

  // Get the id of the mail whose content is to be displayed
  id = this.dataset.attributeId;

  // Send a GET request to the API to fetch the mail
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
      console.log(email);
      // Get current user
      const userEmail = document.querySelector('#user-email').innerHTML;

      let buttonText;
      buttonText = email.archived === true ? 'Unarchive' : 'Archive'
      const thisMail = document.createElement('div');
      // Populate this new div element depending on whether the mail is sent or received
      thisMail.innerHTML =      userEmail !== email.sender
                                 ?
                                `<div>
                                 <strong>From: </strong>${email.sender}<br>
                                 <strong>To: </strong>${email.recipients}<br>
                                 <strong>Subject: </strong>${email.subject}<br>
                                 <strong>Timestamp: </strong>${email.timestamp}<br>
                                 <button id='received-reply'>Reply</button>
                                 </div> <hr>
                                 <div>
                                 ${email.body} <br>
                                 <button id='archive'>${buttonText}</button>
                                 </div>` 
                                :
                                `<div>
                                 <strong>From: </strong>${email.sender}<br>
                                 <strong>To: </strong>${email.recipients}<br>
                                 <strong>Subject: </strong>${email.subject}<br>
                                 <strong>Timestamp: </strong>${email.timestamp}<br>
                                 <button id='sent-reply'>Reply</button>
                                 </div> <hr>
                                 <div>
                                 ${email.body} <br>
                                 </div>` 
      // Display the mail content in the 'get-mail' div
      document.querySelector('#get-mail').innerHTML = thisMail.outerHTML;

      // Run functions based on clicked buttons
      if (userEmail !== email.sender) {
        document.querySelector('#archive').addEventListener('click', () => archive_mail(id));
        document.querySelector('#received-reply').addEventListener('click', () => reply(email));
      } else {
        document.querySelector('#sent-reply').addEventListener('click', () => reply(email));
      }      
});

  // Send a PUT request to mark this email as read
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  });
}


function archive_mail(id) {
  // Send a GET request to the API to fetch the email to be archived depending on the passed id
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
      console.log(email);

      if (email.archived === false) {
          fetch(`/emails/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
              archived: true
          })
        })
        .then(() => load_mailbox('inbox'))
      } else {
          document.querySelector('#archive').innerText = 'Unarchive'
          fetch(`/emails/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
              archived: false
          })
        })
        .then(() => load_mailbox('inbox'))
      }
  });
}


function reply(email) {
  // Display the 'compose-mail' div and hide the others
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#get-mail').style.display = 'none';

  // Get the current user
  const userEmail = document.querySelector('#user-email').innerHTML;

  // Fill recipients field depending on if it is a reply to a received mail or a mail the user themself sent
  document.querySelector('#compose-recipients').value = userEmail !== email.sender ? email.sender : email.recipients;
  document.querySelector('#compose-subject').value = email.subject.includes('Re: ') ? email.subject : `Re: ${email.subject}`;
  document.querySelector('#compose-body').value = `On ${email.timestamp}, ${email.sender} wrote : ${email.body}`;

  // Send a POST request to send the reply
  document.querySelector('#compose-form').onsubmit = function() {
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: document.querySelector('#compose-recipients').value,
          subject: document.querySelector('#compose-subject').value,
          body: document.querySelector('#compose-body').value
      })
    })
    .then(response => response.json())
    .then(result => {
        console.log(result);
        load_mailbox('sent');
    });
    return false;
  }
}
