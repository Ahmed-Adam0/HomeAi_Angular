# Contact Form Integration Specification

This document details the backend implementation requirements for the **Contact Us** form in the FurniMind AI application.

---

## 1. Overview
The contact page allows visitors and customers to send inquiries, questions, or feedback. The backend needs to expose a public API endpoint to accept these submissions, validate them, and send an email containing the inquiry details to the platform's support email address: **`furnimindai@gmail.com`**.

---

## 2. API Endpoint Specification

### `POST /api/contact`
Receives the contact form submissions.

* **Authentication:** **None (Public)** — This endpoint must be accessible without a JWT bearer token.
* **Content-Type:** `application/json`

### Request Payload (JSON)
The payload must match the frontend interface `ContactFormData` exactly:

```json
{
  "name": "Ahmed Mohamed",
  "email": "ahmed.customer@example.com",
  "phone": "01214649915",
  "subject": "Inquiry about Custom Chair Orders",
  "message": "Hello, I want to inquire about custom orders for ergonomic office chairs. Do you deliver to Alexandria?"
}
```

#### Field Specifications & Validation Rules
| Field Name | Type | Required | Validation Rules | Description |
| :--- | :--- | :---: | :--- | :--- |
| **`name`** | String | Yes | Min length: 3 characters | Full name of the sender |
| **`email`** | String | Yes | Valid email format | Email address of the sender |
| **`phone`** | String | Yes | Must match Egyptian mobile numbers format: `/^(010|011|012|015)\d{8}$/` | Contact phone number |
| **`subject`** | String | Yes | Min length: 5 characters | Subject of the inquiry |
| **`message`** | String | Yes | Min length: 10 characters | Detailed message |

### Expected Responses

#### `200 OK` (or `201 Created`)
Returned when the message is successfully validated and the email is queued/sent.
```json
{
  "success": true,
  "message": "Your message has been sent successfully. We will get back to you shortly."
}
```

#### `400 Bad Request`
Returned when validation fails or fields are missing.
```json
{
  "success": false,
  "errors": {
    "Email": ["The Email field is not a valid e-mail address."],
    "Phone": ["The Phone field is not in the correct format."]
  }
}
```

#### `500 Internal Server Error`
Returned if SMTP or mail service delivery fails.
```json
{
  "success": false,
  "message": "An error occurred while sending your message. Please try again later."
}
```

---

## 3. Email Delivery Requirements

The core business logic of this endpoint is to forward the form details via email. The backend must adhere to the following rules:

1. **Recipient Address:** The email **MUST** be sent to `furnimindai@gmail.com`.
2. **Reply-To Header:** The **`Reply-To`** header on the email must be set to the user's email address (the `email` field from the request payload). This allows the administrator to simply click **"Reply"** in Gmail to respond directly to the client.
3. **Subject Line Format:** The subject should clearly indicate a new inquiry:
   * Format: `[FurniMind Contact] {subject}` (e.g., `[FurniMind Contact] Inquiry about Custom Chair Orders`)
4. **Email Body (HTML Template):** The email should be a clean HTML layout containing all input data.

---

## 4. Proposed C# ASP.NET Core Implementation Details

Since the backend is built on **ASP.NET Core Web API with Onion Architecture**, below is a reference implementation of the DTO, Controller, and Service layer.

### A. Data Transfer Object (DTO)
```csharp
using System.ComponentModel.DataAnnotations;

namespace FurniMind.Application.DTOs
{
    public class ContactFormDto
    {
        [Required(ErrorMessage = "Name is required")]
        [MinLength(3, ErrorMessage = "Name must be at least 3 characters")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email address")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Phone number is required")]
        [RegularExpression(@"^(010|011|012|015)\d{8}$", ErrorMessage = "Invalid Egyptian phone number")]
        public string Phone { get; set; } = string.Empty;

        [Required(ErrorMessage = "Subject is required")]
        [MinLength(5, ErrorMessage = "Subject must be at least 5 characters")]
        public string Subject { get; set; } = string.Empty;

        [Required(ErrorMessage = "Message is required")]
        [MinLength(10, ErrorMessage = "Message must be at least 10 characters")]
        public string Message { get; set; } = string.Empty;
    }
}
```

### B. Controller
```csharp
using Microsoft.AspNetCore.Mvc;
using FurniMind.Application.DTOs;
using FurniMind.Application.Interfaces;

namespace FurniMind.Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ContactController : ControllerBase
    {
        private readonly IMailService _mailService;

        public ContactController(IMailService mailService)
        {
            _mailService = mailService;
        }

        [HttpPost]
        public async Task<IActionResult> SubmitInquiry([FromBody] ContactFormDto model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var emailSent = await _mailService.SendContactInquiryEmailAsync(model);
                if (emailSent)
                {
                    return Ok(new { success = true, message = "Inquiry submitted successfully." });
                }
                
                return StatusCode(500, new { success = false, message = "Failed to send email." });
            }
            catch (Exception ex)
            {
                // Log exception here
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}
```

### C. Mail Service & HTML Template (Infrastructure Layer)
Using **MailKit / MimeKit** is highly recommended in .NET Core.

```csharp
using MimeKit;
using MailKit.Net.Smtp;
using FurniMind.Application.DTOs;

namespace FurniMind.Infrastructure.Services
{
    public class MailService : IMailService
    {
        private readonly MailSettings _mailSettings; // Loaded from appsettings.json

        public MailService(IOptions<MailSettings> mailSettings)
        {
            _mailSettings = mailSettings.Value;
        }

        public async Task<bool> SendContactInquiryEmailAsync(ContactFormDto inquiry)
        {
            var email = new MimeMessage();
            
            // 1. Sender (The system's authenticated email account, e.g., notifications@furnimind.ai)
            email.From.Add(new MailboxAddress("FurniMind Support System", _mailSettings.SenderEmail));
            
            // 2. Recipient (Always furnimindai@gmail.com)
            email.To.Add(MailboxAddress.Parse("furnimindai@gmail.com"));
            
            // 3. Reply-To (Set to the user who filled the form)
            email.ReplyTo.Add(MailboxAddress.Parse(inquiry.Email));

            // 4. Subject
            email.Subject = $"[FurniMind Contact] {inquiry.Subject}";

            // 5. HTML Body Template
            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = $@"
                <div style='font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);'>
                    <div style='background: linear-gradient(135deg, #2b3a42, #3f5866); color: white; padding: 20px; text-align: center;'>
                        <h2 style='margin: 0;'>New Contact Inquiry</h2>
                        <p style='margin: 5px 0 0 0; opacity: 0.8;'>FurniMind AI Platform</p>
                    </div>
                    <div style='padding: 25px; background-color: #fafafa;'>
                        <h3 style='color: #2b3a42; border-bottom: 2px solid #3f5866; padding-bottom: 8px; margin-top: 0;'>Inquiry Details</h3>
                        <table style='width: 100%; border-collapse: collapse;'>
                            <tr>
                                <td style='padding: 8px 0; font-weight: bold; width: 30%; color: #555;'>Sender Name:</td>
                                <td style='padding: 8px 0; color: #333;'>{inquiry.Name}</td>
                            </tr>
                            <tr>
                                <td style='padding: 8px 0; font-weight: bold; color: #555;'>Email:</td>
                                <td style='padding: 8px 0; color: #333;'><a href='mailto:{inquiry.Email}'>{inquiry.Email}</a></td>
                            </tr>
                            <tr>
                                <td style='padding: 8px 0; font-weight: bold; color: #555;'>Phone:</td>
                                <td style='padding: 8px 0; color: #333;'><a href='tel:{inquiry.Phone}'>{inquiry.Phone}</a></td>
                            </tr>
                            <tr>
                                <td style='padding: 8px 0; font-weight: bold; color: #555;'>Subject:</td>
                                <td style='padding: 8px 0; color: #333; font-style: italic;'>{inquiry.Subject}</td>
                            </tr>
                        </table>
                        
                        <h3 style='color: #2b3a42; border-bottom: 2px solid #3f5866; padding-bottom: 8px; margin-top: 25px;'>Message</h3>
                        <div style='background-color: white; border: 1px solid #e0e0e0; border-radius: 4px; padding: 15px; color: #444; white-space: pre-wrap;'>{inquiry.Message}</div>
                        
                        <div style='margin-top: 25px; text-align: center;'>
                            <a href='mailto:{inquiry.Email}' style='display: inline-block; padding: 12px 24px; color: white; background-color: #3f5866; text-decoration: none; border-radius: 4px; font-weight: bold;'>Reply to {inquiry.Name}</a>
                        </div>
                    </div>
                    <div style='background-color: #eee; padding: 15px; text-align: center; font-size: 12px; color: #666;'>
                        This email was automatically generated by the FurniMind AI Platform contact service.
                    </div>
                </div>"
            };

            email.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            try
            {
                // Connect to SMTP Server (e.g., SendGrid, Mailgun, SMTP Relay, Gmail SMTP)
                await client.ConnectAsync(_mailSettings.Host, _mailSettings.Port, MailKit.Security.SecureSocketOptions.StartTls);
                await client.AuthenticateAsync(_mailSettings.Username, _mailSettings.Password);
                await client.SendAsync(email);
                await client.DisconnectAsync(true);
                return true;
            }
            catch
            {
                // Fail gracefully & log
                return false;
            }
        }
    }
}
```
