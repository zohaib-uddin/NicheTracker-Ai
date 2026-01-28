
// This service integrates with a Google Apps Script Web App to send emails.
// You must deploy a Google Script as a Web App with "Execute as: Me" and "Who has access: Anyone".

// 🔴 IMPORTANT: REPLACE THIS URL WITH YOUR ACTUAL GOOGLE SCRIPT DEPLOYMENT URL
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxWC88eiXeH7GbbQYHBZSUzSzjV0S3z3fgNKJ63B60orSZ5wRoNnBp2dTBhG6GqhpPUzA/exec"; 

export const sendGoogleScriptNotification = async (type: 'signup' | 'weekly_digest' | 'new_video' | 'test', email: string, data?: any) => {
    
    // Check if user is Pro (except for signup/test)
    if (type !== 'signup' && type !== 'test' && !data?.is_pro) {
        console.log("Notification skipped: User is not Pro.");
        return; 
    }

    // Check if URL is configured
    if (GOOGLE_SCRIPT_URL.includes("YOUR_DEPLOYMENT_ID")) {
        console.error("❌ EMAIL FAILED: Google Script URL is not configured in services/notificationService.ts");
        console.warn("Please deploy the code from GoogleScriptCode.js and update the URL.");
        alert("System Error: Email service not configured. Please contact admin.");
        return;
    }

    const payload = {
        type,
        email,
        timestamp: new Date().toISOString(),
        data: data || {}
    };

    console.log(`[Google Script] Sending ${type} notification to ${email}...`);

    try {
        // We use no-cors because Google Scripts don't support CORS headers easily for POST from browser
        // 'no-cors' means we can't read the response, but the request DOES send.
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', 
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        console.log(`[Google Script] Request dispatched successfully.`);
    } catch (error) {
        console.error("[Google Script] Network Error:", error);
    }
};
