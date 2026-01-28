
// COPY THIS CODE INTO SCRIPT.GOOGLE.COM
// Deploy as Web App -> Execute as: Me -> Who has access: Anyone

function doPost(e) {
  try {
    // Parse the incoming JSON data from the React App
    var jsonString = e.postData.contents;
    var payload = JSON.parse(jsonString);
    
    var type = payload.type;
    var email = payload.email;
    var data = payload.data || {};
    
    var subject = "Notification from Nych.ai";
    var htmlBody = "";
    var plainBody = "";

    // 1. NEW VIDEO ALERT
    if (type === 'new_video') {
      subject = "🔥 New Viral Alert: " + (data.video_title || "Trending Video");
      
      plainBody = "New Viral Video Detected!\n\n" +
                  "Title: " + data.video_title + "\n" +
                  "Category: " + data.category + "\n" +
                  "Views: " + data.views + "\n" +
                  "Link: " + data.url;

      htmlBody = 
        "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f4f4f5; padding: 20px; border-radius: 10px;'>" +
          "<div style='background: #000; padding: 15px; border-radius: 8px 8px 0 0; text-align: center;'>" +
            "<h2 style='color: #fff; margin: 0;'>Nych.ai Alert</h2>" +
          "</div>" +
          "<div style='background: #fff; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #ddd;'>" +
            "<h3 style='margin-top: 0;'>New Video in " + data.category + "</h3>" +
            "<p><strong>Title:</strong> " + data.video_title + "</p>" +
            "<p><strong>Stats:</strong> " + data.views + " Views • " + data.growth + " Growth</p>" +
            "<p style='margin: 20px 0;'>" + (data.description || "A new trending video has been identified by our AI.") + "</p>" +
            "<a href='" + data.url + "' style='background: #10b981; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;'>Watch Video</a>" +
          "</div>" +
          "<div style='text-align: center; font-size: 12px; color: #888; margin-top: 15px;'>" +
            "<p>You received this because you enabled 'New Video Alerts' in your Pro settings.</p>" +
          "</div>" +
        "</div>";
    } 
    
    // 2. WEEKLY DIGEST
    else if (type === 'weekly_digest') {
      subject = "📈 Your Weekly Nych Report";
      htmlBody = "<h1>Weekly Digest</h1><p>Here are the top performing niches this week...</p>";
    }

    // 3. TEST ALERT (From Settings Page)
    else if (type === 'test') { // Added test handler
        subject = "🔔 Test Alert: Nych.ai Notifications";
        htmlBody = "<p>This is a test to confirm your email alerts are working correctly.</p>";
        plainBody = "This is a test notification.";
    }

    // Send the Email
    if (email) {
      if (htmlBody) {
        MailApp.sendEmail({
          to: email,
          subject: subject,
          htmlBody: htmlBody
        });
      } else {
        MailApp.sendEmail({
          to: email,
          subject: subject,
          body: plainBody
        });
      }
    }

    return ContentService.createTextOutput(JSON.stringify({status: "success", email: email}))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    // Log error inside Google Script Dashboard
    console.error(err);
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
