import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Footer } from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
            <p className="text-sm text-muted-foreground">Last Updated: {new Date().toLocaleDateString()}</p>
            <p className="text-sm text-muted-foreground">Version 1.0</p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-6 text-foreground">
                <section>
                  <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Welcome to Quotable. We respect your privacy and are committed to protecting your personal data. 
                    This privacy policy will inform you about how we look after your personal data when you visit our 
                    website and use our services, and tell you about your privacy rights and how the law protects you.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">2. Data Controller</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Quotable is the controller and responsible for your personal data (collectively referred to as 
                    "Quotable", "we", "us" or "our" in this privacy policy).
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">3. Data We Collect</h2>
                  <p className="text-muted-foreground leading-relaxed mb-2">
                    We may collect, use, store and transfer different kinds of personal data about you:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li><strong>Identity Data:</strong> First name, last name, username or similar identifier, business name</li>
                    <li><strong>Contact Data:</strong> Email address, telephone numbers, business address</li>
                    <li><strong>Technical Data:</strong> IP address, browser type and version, time zone setting, browser plug-in types and versions, operating system and platform</li>
                    <li><strong>Usage Data:</strong> Information about how you use our website and services</li>
                    <li><strong>Business Data:</strong> Client information, quotes, invoices, financial records, schedules that you create and store in the Service</li>
                    <li><strong>Marketing and Communications Data:</strong> Your preferences in receiving marketing from us and your communication preferences</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">4. How We Collect Your Data</h2>
                  <p className="text-muted-foreground leading-relaxed mb-2">We use different methods to collect data from and about you including:</p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li><strong>Direct interactions:</strong> You provide data by filling in forms or corresponding with us by email or otherwise</li>
                    <li><strong>Automated technologies:</strong> As you interact with our website, we may automatically collect Technical Data about your equipment, browsing actions and patterns</li>
                    <li><strong>Third parties:</strong> We may receive personal data about you from analytics providers such as Google</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">5. How We Use Your Data</h2>
                  <p className="text-muted-foreground leading-relaxed mb-2">
                    We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>To register you as a new customer and create your account</li>
                    <li>To provide and manage the Service, including quote generation, invoice management, and scheduling</li>
                    <li>To process and deliver your service orders</li>
                    <li>To manage our relationship with you, including notifying you about changes to our terms or privacy policy</li>
                    <li>To enable you to complete surveys or provide feedback</li>
                    <li>To administer and protect our business and the Service (including troubleshooting, data analysis, testing, system maintenance)</li>
                    <li>To deliver relevant website content and advertisements to you and measure their effectiveness</li>
                    <li>To use data analytics to improve our website, services, marketing, customer relationships and experiences</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">6. Data Security</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We have put in place appropriate security measures to prevent your personal data from being accidentally 
                    lost, used or accessed in an unauthorized way, altered or disclosed. All data is encrypted in transit using 
                    SSL/TLS and at rest using industry-standard encryption. We limit access to your personal data to those 
                    employees, agents, contractors and other third parties who have a business need to know. Access is granted 
                    only on a need-to-know basis and subject to strict confidentiality obligations.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">7. Data Retention</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We will only retain your personal data for as long as necessary to fulfil the purposes we collected it for, 
                    including satisfying any legal, accounting, or reporting requirements. To determine the appropriate retention 
                    period for personal data, we consider the amount, nature, and sensitivity of the personal data, the potential 
                    risk of harm from unauthorized use or disclosure of your personal data, the purposes for which we process 
                    your personal data and whether we can achieve those purposes through other means, and the applicable legal 
                    requirements.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">8. Your Legal Rights (GDPR)</h2>
                  <p className="text-muted-foreground leading-relaxed mb-2">
                    Under certain circumstances, you have rights under data protection laws in relation to your personal data:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li><strong>Right to access:</strong> Request access to your personal data</li>
                    <li><strong>Right to correction:</strong> Request correction of your personal data</li>
                    <li><strong>Right to erasure:</strong> Request erasure of your personal data</li>
                    <li><strong>Right to object:</strong> Object to processing of your personal data</li>
                    <li><strong>Right to restriction:</strong> Request restriction of processing your personal data</li>
                    <li><strong>Right to data portability:</strong> Request transfer of your personal data</li>
                    <li><strong>Right to withdraw consent:</strong> Withdraw consent at any time where we are relying on consent to process your personal data</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed mt-3">
                    You can exercise any of these rights at any time by contacting us. You will not have to pay a fee to 
                    access your personal data (or to exercise any of the other rights). However, we may charge a reasonable 
                    fee if your request is clearly unfounded, repetitive or excessive.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">9. Cookies</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Our website uses cookies to distinguish you from other users and provide you with a good experience when 
                    you browse our website. A cookie is a small file of letters and numbers that we store on your browser or 
                    the hard drive of your computer. We use the following types of cookies:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mt-2">
                    <li><strong>Strictly necessary cookies:</strong> Required for the operation of our website (e.g., authentication, session management)</li>
                    <li><strong>Analytical/performance cookies:</strong> Allow us to recognize and count visitors and see how visitors move around our website</li>
                    <li><strong>Functionality cookies:</strong> Used to recognize you when you return to our website and remember your preferences</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed mt-3">
                    You can set your browser to refuse all or some cookies, or to alert you when websites set or access cookies. 
                    If you disable or refuse cookies, please note that some parts of this website may become inaccessible or not 
                    function properly.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">10. Third-Party Services</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We may share your personal data with third-party service providers who perform services on our behalf, such 
                    as hosting, data analysis, payment processing, and customer service. These third parties have access to your 
                    personal data only to perform these tasks on our behalf and are obligated not to disclose or use it for any 
                    other purpose. We require all third parties to respect the security of your personal data and to treat it in 
                    accordance with the law.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">11. International Transfers</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We may transfer your personal data outside the United Kingdom and the European Economic Area (EEA). Whenever 
                    we transfer your personal data out of the UK/EEA, we ensure a similar degree of protection is afforded to it 
                    by implementing appropriate safeguards, such as standard contractual clauses approved by the European Commission.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">12. Data Breach Notification</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    In the event of a data breach that is likely to result in a risk to your rights and freedoms, we will notify 
                    you and any applicable regulator within 72 hours of becoming aware of the breach, in accordance with GDPR 
                    requirements.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">13. Children's Privacy</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Our Service is not intended for children under 16 years of age. We do not knowingly collect personal data 
                    from children under 16. If you are a parent or guardian and believe your child has provided us with personal 
                    data, please contact us so we can delete it.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">14. Changes to This Privacy Policy</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new 
                    Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy 
                    Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on 
                    this page.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">15. Contact Us</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    If you have any questions about this Privacy Policy, your data protection rights, or wish to exercise any of 
                    your rights, please contact us at:
                  </p>
                  <ul className="list-none space-y-1 text-muted-foreground ml-4 mt-2">
                    <li>Email: support@quotable-it.co.uk</li>
                    <li>Data Protection Officer: support@quotable-it.co.uk</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed mt-3">
                    You also have the right to make a complaint at any time to the Information Commissioner's Office (ICO), 
                    the UK supervisory authority for data protection issues (www.ico.org.uk).
                  </p>
                </section>

                <div className="mt-8 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground italic">
                    By using Quotable, you acknowledge that you have read and understood this Privacy Policy and consent to 
                    the collection, use, and disclosure of your personal data as described herein.
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

export default Privacy;
