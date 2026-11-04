import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface WelcomeEmailProps {
  userName: string;
  userEmail: string;
}

export const WelcomeEmail = ({ userName, userEmail }: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to Quotable - Your business management platform</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          Welcome to Quotable
        </Heading>
        <Text style={text}>
          Hi {userName || 'there'},
        </Text>
        <Text style={text}>
          Thank you for joining Quotable! We're excited to help you streamline your quoting, invoicing, and scheduling.
        </Text>
        <Section style={features}>
          <Text style={featureTitle}>Get started with:</Text>
          <Text style={featureItem}>📝 Create professional quotes in minutes</Text>
          <Text style={featureItem}>💼 Convert quotes to invoices instantly</Text>
          <Text style={featureItem}>📅 Schedule jobs with drag-and-drop calendar</Text>
          <Text style={featureItem}>📊 Track payments and tax automatically</Text>
        </Section>
        <Text style={text}>
          Your account is now active and ready to use at {userEmail}.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          Need help? Contact us at support@quotable-it.co.uk
        </Text>
      </Container>
    </Body>
  </Html>
);

export default WelcomeEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const h1 = {
  color: '#333',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 40px',
};


const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 40px',
};

const features = {
  padding: '24px 40px',
  backgroundColor: '#f8fafc',
  margin: '20px 0',
};

const featureTitle = {
  color: '#333',
  fontSize: '18px',
  fontWeight: '600',
  marginBottom: '12px',
};

const featureItem = {
  color: '#555',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '8px 0',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  padding: '0 40px',
};
