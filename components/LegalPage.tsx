
import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

interface LegalPageProps {
    type: 'privacy' | 'terms' | 'refund' | 'affiliate';
    onBack: () => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({ type, onBack }) => {
    
    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const renderContent = () => {
        switch(type) {
            case 'privacy':
                return (
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2">Privacy Policy</h1>
                            <p className="text-sm text-gray-500">Last updated: August 15th, 2025</p>
                        </div>

              <section className="space-y-4">
  <h2 className="text-xl font-bold text-white">Information Collection</h2>
  <p className="leading-relaxed">
    At NicheTracker, we collect certain information to operate, maintain, and improve our platform effectively.
  </p>
</section>

<section className="space-y-4">
  <h2 className="text-xl font-bold text-white">Information You Provide</h2>
  <p className="leading-relaxed">
    We may collect personal information that you voluntarily provide when you register an account, use our features, contact support, or interact with our services. This may include your name, email address, and any content or data you submit or upload while using NicheTracker.
  </p>
</section>

<section className="space-y-4">
  <h2 className="text-xl font-bold text-white">Automated Information Collection</h2>
  <p className="leading-relaxed">
    When you access or use our Service, certain information is collected automatically. This may include your IP address, browser details, device type, operating system, referral URLs, pages viewed, timestamps, and general usage patterns to help us understand how our platform is used.
  </p>
</section>

<section className="space-y-4">
  <h2 className="text-xl font-bold text-white">Cookies and Tracking Technologies</h2>
  <p className="leading-relaxed">
    NicheTracker uses cookies and similar technologies to enhance user experience, remember preferences, analyze traffic, and improve overall functionality. You may control cookie usage through your browser settings.
  </p>
</section>

<section className="space-y-4">
  <h2 className="text-xl font-bold text-white">Use of Information</h2>
  <p className="leading-relaxed">We use the collected information to:</p>
  <ul className="list-disc list-inside space-y-2 ml-2">
    <li>Operate, manage, and improve our platform and features.</li>
    <li>Provide customer support and respond to user inquiries.</li>
    <li>Analyze usage trends to enhance performance and usability.</li>
    <li>Maintain platform security and prevent unauthorized activity.</li>
  </ul>
</section>

<section className="space-y-4">
  <h2 className="text-xl font-bold text-white">Sharing of Information</h2>
  <p className="leading-relaxed">
    We do not sell your personal data. However, certain information may be shared under the circumstances described below.
  </p>
</section>

<section className="space-y-4">
  <h2 className="text-xl font-bold text-white">Service Providers</h2>
  <p className="leading-relaxed">
    We may share information with trusted third-party service providers who assist us in operating and maintaining NicheTracker. These providers are bound by confidentiality and data protection obligations.
  </p>
</section>

<section className="space-y-4">
  <h2 className="text-xl font-bold text-white">Legal Obligations</h2>
  <p className="leading-relaxed">
    We may disclose information if required to comply with applicable laws, legal proceedings, or valid requests from public or governmental authorities.
  </p>
</section>

<section className="space-y-4">
  <h2 className="text-xl font-bold text-white">Protection of Rights and Safety</h2>
  <p className="leading-relaxed">
    Information may be shared when necessary to protect the rights, safety, or property of NicheTracker, our users, or the public, including for fraud prevention and security purposes.
  </p>
</section>

<section className="space-y-4">
  <h2 className="text-xl font-bold text-white">Security</h2>
  <p className="leading-relaxed">
    We implement reasonable administrative, technical, and organizational safeguards to protect your information. While we strive to use commercially acceptable means to protect data, no method of transmission over the Internet is completely secure.
  </p>
</section>

<section className="space-y-4">
  <h2 className="text-xl font-bold text-white">International Transfers</h2>
  <p className="leading-relaxed">
    Your information may be processed and stored on servers located in different countries. By using our Service, you consent to the transfer of your data to jurisdictions with different data protection laws.
  </p>
</section>

<section className="space-y-4">
  <h2 className="text-xl font-bold text-white">Your Rights</h2>
  <p className="leading-relaxed">
    Depending on your location, you may have rights regarding your personal data, including access, correction, deletion, or limitation of processing. You may contact us to exercise these rights.
  </p>
</section>

<section className="space-y-4">
  <h2 className="text-xl font-bold text-white">Changes to This Privacy Policy</h2>
  <p className="leading-relaxed">
    We may update this Privacy Policy periodically to reflect changes in our practices or legal requirements. Any updates will be posted on this page with immediate effect.
  </p>
</section>

<section className="space-y-4">
  <h2 className="text-xl font-bold text-white">Contact Us</h2>
  <p className="leading-relaxed">
    If you have any questions or concerns regarding this Privacy Policy, you may contact us at{" "}
    <a 
  href="mailto:contact@nichetracker.ai" 
  className="text-green-500 font-medium"
>
  contact@nichetracker.ai
</a>
.
  </p>
</section>

                    </div>
                );
            case 'terms':
                return (
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2">Terms of Service</h1>
                            <p className="text-sm text-gray-500">Last updated: August 15th, 2025</p>
                        </div>

              <section className="space-y-4">
  <h2 className="text-xl font-bold text-white">Acceptance of Terms</h2>
  <p className="leading-relaxed">
    By accessing, browsing, or using NicheTracker and its features, you acknowledge that you have read, understood, and agree to comply with these Terms of Service ("Terms"). If you do not agree with any part of these Terms, you must discontinue use of our services.
  </p>
</section>

<section className="space-y-4">
  <h2 className="text-xl font-bold text-white">Description of Service</h2>
  <p className="leading-relaxed">
    NicheTracker is a digital platform that provides tools and insights related to content niches, trends, and analytics to help creators and businesses make informed decisions. The features and functionality of the service may evolve over time.
  </p>
</section>

<section className="space-y-4">
  <h2 className="text-xl font-bold text-white">Use of Service</h2>
  <p className="leading-relaxed">
    You agree to use NicheTracker only for lawful purposes and in accordance with these Terms. You must not use the service in any way that could damage, disable, or impair the platform or interfere with other users.
  </p>
  <p className="leading-relaxed">
    Subject to these Terms, NicheTracker grants you a limited, revocable, non-exclusive, and non-transferable right to access and use the service for personal or internal business use.
  </p>
</section>

<section className="space-y-4">
  <h2 className="text-xl font-bold text-white">User Conduct</h2>
  <p className="leading-relaxed">
    You are solely responsible for your actions and any data or content you submit, upload, or display while using NicheTracker.
  </p>
  <p className="leading-relaxed">
    You agree not to engage in activities that are illegal, misleading, abusive, harmful, defamatory, offensive, or that violate the rights of others, including intellectual property or privacy rights.
  </p>
</section>

<section className="space-y-4">
  <h2 className="text-xl font-bold text-white">Intellectual Property</h2>
  <p className="leading-relaxed">
    You retain ownership of any content you submit through the platform. By using the service, you grant NicheTracker a non-exclusive, worldwide, royalty-free license to use, host, and display such content solely for operating and improving the service.
  </p>
  <p className="leading-relaxed">
    All platform elements, including software, design, branding, logos, and proprietary technology, are owned by NicheTracker and are protected by applicable intellectual property laws.
  </p>
</section>

<section className="space-y-4">
  <h2 className="text-xl font-bold text-white">Termination</h2>
  <p className="leading-relaxed">
    We reserve the right to suspend or terminate your access to NicheTracker at our discretion, without prior notice, if you violate these Terms or misuse the service.
  </p>
</section>

<section className="space-y-4">
  <h2 className="text-xl font-bold text-white">Refund Policy</h2>
  <p className="leading-relaxed">
    All payments made to NicheTracker are subject to our Refund Policy. Unless otherwise stated, fees are non-refundable. Full details are available at{" "}
    <span className="text-green-500 font-medium">NicheTracker.ai/refund-policy</span>.
  </p>
</section>

<section className="space-y-4">
  <h2 className="text-xl font-bold text-white">Disclaimer of Warranties</h2>
  <p className="leading-relaxed">
    NicheTracker is provided on an "as is" and "as available" basis. We make no warranties or representations regarding accuracy, reliability, availability, or suitability of the service for your specific needs.
  </p>
</section>

<section className="space-y-4">
  <h2 className="text-xl font-bold text-white">Age Restriction</h2>
  <p className="leading-relaxed">
    The service is intended for users who are at least 18 years old. By using NicheTracker, you confirm that you meet this age requirement. We may remove accounts found to be in violation of this rule.
  </p>
</section>

<section className="space-y-4">
  <h2 className="text-xl font-bold text-white">Limitation of Liability</h2>
  <p className="leading-relaxed">
    To the maximum extent permitted by law, NicheTracker shall not be liable for any indirect, incidental, consequential, or loss-related damages arising from your use of, or inability to use, the service.
  </p>
</section>

<section className="space-y-4">
  <h2 className="text-xl font-bold text-white">Changes to Terms</h2>
  <p className="leading-relaxed">
    We may revise these Terms from time to time. Updated Terms will be posted on this page, and continued use of the service constitutes acceptance of the revised Terms.
  </p>
</section>

<section className="space-y-4">
  <h2 className="text-xl font-bold text-white">Governing Law</h2>
  <p className="leading-relaxed">
    These Terms shall be governed and interpreted in accordance with the laws applicable in the jurisdiction where NicheTracker operates, without regard to conflict of law principles.
  </p>
</section>

<section className="space-y-4">
  <h2 className="text-xl font-bold text-white">Contact Information</h2>
  <p className="leading-relaxed">
    If you have any questions about these Terms of Service, you can contact us at{" "}
    <a 
  href="mailto:contact@nichetracker.ai" 
  className="text-green-500 font-medium"
>
  contact@nichetracker.ai
</a>
.
  </p>
</section>

                    </div>
                );
            case 'refund':
                return (
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2">Refund Policy</h1>
                            <p className="text-sm text-gray-500">Last updated: November 22nd, 2025</p>
                        </div>
<section className="space-y-4">
  <h2 className="text-xl font-bold text-white">1. No Refunds</h2>
  <p className="leading-relaxed">
    <strong>ALL PURCHASES ARE FINAL.</strong> NicheTracker does not provide refunds for any subscriptions, products, or services once payment has been successfully processed.
  </p>
  <p className="leading-relaxed">
    By completing a purchase, you confirm that you understand and agree to this no-refund policy in full.
  </p>
  <p className="leading-relaxed">
    Refund requests will not be granted for reasons including, but not limited to, dissatisfaction with the service, accidental purchases, lack of usage, or changes in personal or financial circumstances.
  </p>
</section>

<section className="space-y-4">
  <h2 className="text-xl font-bold text-white">2. Cancellation Policy</h2>

  <h3 className="text-lg font-bold text-white">2.1 Eligibility</h3>
  <p className="leading-relaxed">
    Users may cancel their active subscription at any time through their account dashboard without providing a reason or obtaining approval.
  </p>

  <h3 className="text-lg font-bold text-white">2.2 Cancellation Process</h3>
  <p className="leading-relaxed">To cancel your subscription, please follow these steps:</p>
  <ol className="list-decimal list-inside space-y-2 ml-2">
    <li>Visit NicheTracker.ai/dashboard</li>
    <li>Click on your profile icon located in the top-right corner</li>
    <li>Navigate to the "Settings" section</li>
    <li>Select the "Cancel Subscription" option and confirm</li>
  </ol>

  <h3 className="text-lg font-bold text-white">2.3 Service Continuation</h3>
  <p className="leading-relaxed">
    After cancellation, your subscription will remain active until the end of the current billing period. During this time, you will retain full access to the subscribed features.
  </p>

  <h3 className="text-lg font-bold text-white">2.4 No Further Charges</h3>
  <p className="leading-relaxed">
    Once cancellation is completed, no additional charges will be applied to your account unless you choose to reactivate the service.
  </p>

  <h3 className="text-lg font-bold text-white">2.5 Data Retention</h3>
  <p className="leading-relaxed">
    Account data may be retained for a limited period to allow for potential reactivation. NicheTracker reserves the right to remove stored data after cancellation. If you wish to request data deletion, please contact support in accordance with applicable data protection laws.
  </p>
</section>

<section className="space-y-4">
  <h2 className="text-xl font-bold text-white">3. Contact Information</h2>
  <p className="leading-relaxed">
    If you have questions regarding this Refund Policy or your subscription, you may contact us through the following channels:
  </p>
  <ul className="list-disc list-inside space-y-2 ml-2">
    <li>Email: <a 
  href="mailto:contact@nichetracker.ai" 
  className="text-green-500 font-medium"
>
  contact@nichetracker.ai
</a>
</li>
    <li>Discord: <span className="text-green-500">Official NicheTracker Discord</span></li>
  </ul>
</section>

<section className="space-y-4">
  <h2 className="text-xl font-bold text-white">4. Amendments</h2>
  <p className="leading-relaxed">
    NicheTracker reserves the right to update or revise this Refund Policy at any time. Any changes will take effect immediately upon being published on our website.
  </p>
  <p className="leading-relaxed">
    It is your responsibility to review this Policy periodically. The most recent revision date will indicate when updates were made.
  </p>
</section>

<section className="space-y-4">
  <h2 className="text-xl font-bold text-white">5. Governing Law</h2>
  <p className="leading-relaxed">
    This Refund Policy shall be governed by and interpreted in accordance with the laws applicable in the jurisdiction where NicheTracker operates, without consideration of conflict-of-law principles.
  </p>
</section>

                    </div>
                );
            case 'affiliate':
                return (
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2">Affiliate Terms of Service</h1>
                        </div>

                      <section className="space-y-4">
  <h2 className="text-xl font-bold text-white">1. Introduction</h2>
  <p className="leading-relaxed">
    Welcome to the NicheTracker Affiliate Program. By applying to or participating in this program ("Program"), you agree to comply with these Affiliate Terms ("Agreement"). Please review this Agreement carefully before promoting NicheTracker.
  </p>
</section>

<section className="space-y-4">
  <h2 className="text-xl font-bold text-white">2. Enrollment in the Program</h2>
  <p className="leading-relaxed">
    To join the Program, you must submit an application through our designated affiliate platform. NicheTracker reserves the right to approve or reject any application at its sole discretion if we determine the promotional source is not suitable.
  </p>
</section>

<section className="space-y-4">
  <h2 className="text-xl font-bold text-white">3. Affiliate Obligations</h2>
  <p className="leading-relaxed">As a NicheTracker affiliate, you agree to the following:</p>
  <ul className="list-disc list-inside space-y-2 ml-2">
    <li>You will promote NicheTracker honestly and in compliance with all applicable laws and regulations.</li>
    <li>You will not engage in misleading, deceptive, or fraudulent promotional practices.</li>
    <li>You will not send unsolicited messages or emails (spam) to promote NicheTracker.</li>
    <li>You may only use NicheTracker branding materials in accordance with provided brand guidelines.</li>
    <li>You will not promote NicheTracker using paid advertising platforms unless explicit written permission is granted.</li>
  </ul>
</section>

<section className="space-y-4">
  <h2 className="text-xl font-bold text-white">4. Approved Promotional Methods</h2>
  <p className="leading-relaxed">
    Affiliates are permitted to promote NicheTracker using ethical and transparent marketing methods, including:
  </p>
  <ul className="list-disc list-inside space-y-2 ml-2">
    <li>Blog posts, websites, and SEO-based content.</li>
    <li>Organic social media posts and communities.</li>
    <li>Email campaigns that comply with anti-spam regulations.</li>
    <li>Educational content such as tutorials, reviews, or walkthroughs.</li>
    <li>Online presentations, streams, or webinars.</li>
  </ul>
</section>

<section className="space-y-4">
  <h2 className="text-xl font-bold text-white">5. Prohibited Activities</h2>
  <p className="leading-relaxed">
    The following activities are strictly prohibited and may result in immediate removal from the Program and forfeiture of commissions:
  </p>
  <ul className="list-disc list-inside space-y-2 ml-2">
    <li>Using paid search, display ads, or social media ads to promote NicheTracker without approval.</li>
    <li>Making false, exaggerated, or unverified claims about NicheTracker.</li>
    <li>Impersonating NicheTracker team members, partners, or creators.</li>
    <li>Offering unauthorized incentives, discounts, or bonuses to drive sign-ups.</li>
    <li>Engaging in cookie stuffing, forced clicks, or hidden tracking techniques.</li>
    <li>Redirecting traffic through deceptive or unauthorized methods.</li>
  </ul>
</section>

<section className="space-y-4">
  <h2 className="text-xl font-bold text-white">6. Commission and Payment</h2>

  <h3 className="text-lg font-bold text-white">Commission Structure</h3>
  <p className="leading-relaxed">
    Affiliates earn commissions on qualifying purchases made through their unique referral links. Current commission rates are displayed within the affiliate dashboard and may change from time to time.
  </p>

  <h3 className="text-lg font-bold text-white">Payment Schedule</h3>
  <p className="leading-relaxed">
    Commission payouts are calculated on a NET-15 basis following the end of each calendar month. Payments may require manual verification, and affiliates may be asked to confirm payout details.
  </p>

  <h3 className="text-lg font-bold text-white">Minimum Payout Threshold</h3>
  <p className="leading-relaxed">
    A minimum balance of $20 in approved commissions is required before a payout is issued. Balances below this amount will roll over to the next payout period.
  </p>
</section>

<section className="space-y-4">
  <h2 className="text-xl font-bold text-white">7. Term and Termination</h2>
  <p className="leading-relaxed">
    This Agreement begins upon acceptance into the Program and remains in effect until terminated. Either party may terminate participation at any time, with or without cause, by providing notice.
  </p>
</section>

<section className="space-y-4">
  <h2 className="text-xl font-bold text-white">8. Relationship of Parties</h2>
  <p className="leading-relaxed">
    Affiliates operate as independent contractors. Nothing in this Agreement creates a partnership, agency, employment, or joint venture relationship between you and NicheTracker.
  </p>
</section>

<section className="space-y-4">
  <h2 className="text-xl font-bold text-white">9. Limitation of Liability</h2>
  <p className="leading-relaxed">
    NicheTracker shall not be responsible for indirect, incidental, or consequential damages related to participation in the Program. Total liability shall not exceed the total commissions paid or payable to the affiliate.
  </p>
</section>

<section className="space-y-4">
  <h2 className="text-xl font-bold text-white">10. Disclaimers</h2>
  <p className="leading-relaxed">
    The Affiliate Program is provided on an "as is" basis. NicheTracker makes no guarantees regarding earnings, conversions, or uninterrupted operation of the platform.
  </p>
</section>

<section className="space-y-4">
  <h2 className="text-xl font-bold text-white">11. Modification</h2>
  <p className="leading-relaxed">
    NicheTracker reserves the right to update or modify this Agreement at any time. Continued participation in the Program after changes are published constitutes acceptance of the revised terms.
  </p>
</section>

                    </div>
                );
            default:
                return <div>Page not found</div>;
        }
    };

    return (
        <div className="min-h-screen bg-[#09090b] text-gray-300 font-sans selection:bg-green-500/30 pt-8 pb-20 px-6 md:px-12">
            <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                <button 
                    onClick={onBack} 
                    className="flex items-center gap-2 text-green-500 hover:text-green-400 font-bold text-sm mb-8 transition-colors group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
                    Back to home
                </button>

                {renderContent()}
            </div>
        </div>
    );
};
