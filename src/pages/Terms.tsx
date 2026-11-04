import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Footer } from "@/components/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Terms and Conditions</CardTitle>
            <p className="text-sm text-muted-foreground">Last Updated: {new Date().toLocaleDateString()}</p>
            <p className="text-sm text-muted-foreground">Version 1.0</p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-6 text-foreground">
                <section>
                  <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    By accessing and using Quotable ("the Service"), you accept and agree to be bound by the terms 
                    and provision of this agreement. If you do not agree to these Terms and Conditions, please do 
                    not use the Service.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Quotable provides a web-based platform for creating quotes, invoices, managing schedules, and 
                    generating tax reports for tradespeople and small businesses. The Service includes tools for 
                    client management, document generation, and financial tracking.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">3. User Account and Registration</h2>
                  <p className="text-muted-foreground leading-relaxed mb-2">
                    To access certain features of the Service, you must register for an account. You agree to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>Provide accurate, current, and complete information during registration</li>
                    <li>Maintain and promptly update your account information</li>
                    <li>Maintain the security of your password and account</li>
                    <li>Accept responsibility for all activities that occur under your account</li>
                    <li>Notify us immediately of any unauthorized use of your account</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">4. User Responsibilities</h2>
                  <p className="text-muted-foreground leading-relaxed mb-2">You agree not to:</p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>Use the Service for any illegal purposes or in violation of any laws</li>
                    <li>Upload or transmit viruses, malware, or any harmful code</li>
                    <li>Attempt to gain unauthorized access to any portion of the Service</li>
                    <li>Interfere with or disrupt the Service or servers</li>
                    <li>Impersonate any person or entity or falsely state your affiliation</li>
                    <li>Collect or store personal data about other users without permission</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">5. Data Privacy and Storage</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We take data privacy seriously. All data you enter into the Service (including client information, 
                    quotes, invoices, and financial records) is stored securely and encrypted. We will not share your 
                    data with third parties except as required by law or with your explicit consent. You retain all 
                    ownership rights to your data and may export or delete it at any time.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">6. Intellectual Property Rights</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    The Service and its original content, features, and functionality are owned by Quotable and are 
                    protected by international copyright, trademark, patent, trade secret, and other intellectual 
                    property laws. You may not copy, modify, distribute, sell, or lease any part of the Service 
                    without our prior written permission.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">7. Limitation of Liability</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    The Service is provided "as is" without warranties of any kind, either express or implied. To the 
                    maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, 
                    consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly 
                    or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your 
                    use of the Service.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">8. Payment Terms</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    If you subscribe to a paid plan, you agree to pay all fees associated with your subscription. 
                    Fees are non-refundable except as required by law. We reserve the right to modify pricing with 
                    30 days' notice to existing subscribers.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">9. Service Modifications and Termination</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We reserve the right to modify, suspend, or discontinue the Service at any time with or without 
                    notice. We may also terminate or suspend your account if you violate these Terms and Conditions. 
                    Upon termination, your right to use the Service will immediately cease.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">10. Accuracy of Information</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    While we strive to provide accurate tools for financial calculations and tax reporting, you are 
                    responsible for verifying the accuracy of all generated documents and reports. We recommend 
                    consulting with qualified professionals for tax and accounting advice.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">11. Indemnification</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    You agree to indemnify and hold harmless Quotable and its officers, directors, employees, and 
                    agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising 
                    from your use of the Service or violation of these Terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">12. Changes to Terms</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We reserve the right to modify these Terms and Conditions at any time. We will notify you of 
                    significant changes via email or through the Service. Your continued use of the Service after 
                    such modifications constitutes acceptance of the updated Terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">13. Governing Law</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    These Terms shall be governed by and construed in accordance with the laws of the United Kingdom, 
                    without regard to its conflict of law provisions. Any disputes arising from these Terms or the 
                    Service shall be subject to the exclusive jurisdiction of the courts of the United Kingdom.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">14. Severability</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    If any provision of these Terms is found to be unenforceable or invalid, that provision shall be 
                    limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain 
                    in full force and effect.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">15. Contact Information</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    If you have any questions about these Terms and Conditions, please contact us through the Service 
                    or via email at support@quotable-it.co.uk.
                  </p>
                </section>

                <div className="mt-8 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground italic">
                    By creating an account and using Quotable, you acknowledge that you have read, understood, and 
                    agree to be bound by these Terms and Conditions.
                  </p>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default Terms;
