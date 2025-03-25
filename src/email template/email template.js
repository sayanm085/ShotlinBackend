// This file contains the email template for sending OTP to the user for email verification.
const OTPtemplate = (otp) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 50px auto;
            background: #fff;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .header h1 {
            color: #4CAF50;
            font-size: 26px;
        }
        .content {
            font-size: 16px;
            color: #555;
            text-align: center;
        }
        .otp-box {
            margin: 20px 0;
            padding: 15px;
            background: #fef6e4;
            border: 2px solid #FF9800;
            border-radius: 8px;
            display: inline-block;
            font-size: 28px;
            font-weight: bold;
            color: #FF5722;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 14px;
            color: #777;
        }
        .footer a {
            color: #4CAF50;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Our Platform!</h1>
        </div>
        <div class="content">
            <p>Thank you for joining us! Please use the OTP below to verify your email address:</p>
            <div class="otp-box">${otp}</div>
            <p>This OTP is valid for the next 10 minutes.</p>
            <p>If you did not request this email, please ignore it.</p>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <div class="footer">
            Need help? Contact our support team at 
            <a href="mailto:support@shotlin.com">support@shotlin.com</a>.
            <br>&copy; ${new Date().getFullYear()} Our Platform. All rights reserved.
        </div>
    </div>
</body>
</html>
  `;
};

const welcomeTemplate = (fullName) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Our Platform</title>
    <style>
        /* General Styles */
        body {
            font-family: 'Arial', sans-serif;
            background-color: #f5f7fa;
            margin: 0;
            padding: 0;
        }
        .email-container {
            max-width: 650px;
            margin: 0 auto;
            background: #ffffff;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
        }

        /* Header */
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .header img {
            width: 120px;
            height: auto;
        }
        .header h1 {
            font-size: 28px;
            color: #333;
        }

        /* Welcome Message */
        .welcome-message {
            font-size: 18px;
            color: #333;
            line-height: 1.6;
            text-align: center;
            margin-bottom: 25px;
        }

        .welcome-message strong {
            color: #007bff;
        }

        /* Button */
        .btn {
            display: inline-block;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            padding: 12px 30px;
            font-size: 16px;
            border-radius: 8px;
            margin: 10px 0;
            text-align: center;
            box-shadow: 0 4px 8px rgba(0, 123, 255, 0.2);
            transition: background-color 0.3s;
        }
        .btn:hover {
            background-color: #0056b3;
        }

        /* Centering Button */
        .button-container {
            text-align: center;
        }

        /* Footer */
        .footer {
            text-align: center;
            font-size: 14px;
            color: #888;
            margin-top: 30px;
        }
        .footer p {
            margin: 5px 0;
        }
        .footer a {
            color: #007bff;
            text-decoration: none;
        }

        /* Responsive Design */
        @media (max-width: 600px) {
            .email-container {
                padding: 15px;
            }
            .header h1 {
                font-size: 24px;
            }
            .welcome-message {
                font-size: 16px;
            }
            .btn {
                font-size: 14px;
                padding: 10px 25px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <img src="https://your-logo-url.com/logo.png" alt="Logo">
            <h1>Welcome to Our Platform, ${fullName}!</h1>
        </div>

        <div class="welcome-message">
            <p>We are excited to have you on board. Your account has been created successfully, and you're all set to explore the amazing features our platform offers.</p>
        </div>

        <!-- Centering the button -->
        <div class="button-container">
            <a href="https://your-platform.com/dashboard" class="btn">Go to Dashboard</a>
        </div>

        <div class="footer">
            <p>If you have any questions, feel free to <a href="mailto:support@your-platform.com">contact us</a>.</p>
            <p>&copy; 2025 Your Platform. All rights reserved.</p>
        </div>
    </div>
</body>
</html>

`;
};

const meetingScheduleTemplate = (meetingDate, meetingTime, meetingLink) => {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Meeting Confirmation</title>
  <style type="text/css">
    /* Basic Reset & Global Settings */
    body, table, td, a {
      margin: 0;
      padding: 0;
      text-decoration: none;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    }
    img {
      border: 0;
      outline: none;
      text-decoration: none;
    }
    body {
      width: 100% !important;
      height: 100% !important;
      margin: 0;
      padding: 20px 0;
      /* Subtle gradient background (fallback to a solid color if gradient not supported) */
      background: #f2f5f9;
      background: linear-gradient(180deg, #eaeef3 0%, #f2f5f9 100%);
    }

    /* Container holding the card */
    .email-wrapper {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }

    /* Card styling */
    .email-card {
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      padding: 30px 25px;
      text-align: center;
    }

    /* Logo or Icon */
    .email-logo {
      margin-bottom: 15px;
    }
    .email-logo img {
      max-width: 50px;
      height: auto;
    }

    /* Heading */
    h1 {
      font-size: 24px;
      margin: 10px 0 20px;
      color: #333333;
    }

    /* Paragraph & Body Text */
    p {
      font-size: 16px;
      line-height: 1.6;
      margin: 10px 0;
      color: #555555;
    }

    /* Highlighted text (date/time) */
    .highlight {
      font-weight: bold;
      color: #222222;
    }

    /* CTA Button */
    .cta-button {
      display: inline-block;
      margin: 25px auto 0;
      padding: 14px 30px;
      background-color: #0073e6;
      color: #ffffff !important;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      text-decoration: none;
      transition: background-color 0.3s ease;
    }
    .cta-button:hover {
      background-color: #005bb5;
    }

    /* Footer */
    .email-footer {
      text-align: center;
      margin-top: 30px;
      font-size: 13px;
      color: #999999;
    }
    .email-footer a {
      color: #999999;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <table class="email-wrapper" cellspacing="0" cellpadding="0" border="0" align="center">
    <tr>
      <td>
        <!-- Card -->
        <div class="email-card">
          <!-- Logo / Icon (Optional) -->
          <div class="email-logo">
            <!-- Replace the image source with your own logo or icon -->
            <img src="https://cdn-icons-png.flaticon.com/512/1162/1162531.png" alt="Meeting Logo">
          </div>

          <!-- Title -->
          <h1>Meeting Confirmation</h1>

          <!-- Message Body -->
          <p>
            Your meeting has been scheduled successfully for 
            <span class="highlight">${meetingDate}</span> 
            at 
            <span class="highlight">${meetingTime}</span>.
          </p>

          <p>Please click the button below to join the meeting:</p>

          <!-- CTA Button -->
          <a href="${meetingLink}" class="cta-button">Join Meeting</a>

          <!-- Additional Info -->
          <p style="margin-top: 30px; font-size:14px; color:#777777;">
            If you have any questions or need assistance, please 
            <a href="https://shotlin.com/contact" style="color:#0073e6;">contact us</a>.
          </p>
        </div>
        <!-- End Card -->

        <!-- Footer -->
        <div class="email-footer">
          <p>All rights reserved by Shotlin © 2025</p>
          <p>Email: support@shotlin.in &nbsp;|&nbsp; Contact Number: +91 9382214304</p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};


export { OTPtemplate, welcomeTemplate,meetingScheduleTemplate };
