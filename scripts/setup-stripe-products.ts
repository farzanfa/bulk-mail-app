import { stripe } from '../lib/stripe';

async function setupStripeProducts() {
  try {
    console.log('Creating Stripe products and prices...\n');

    // Create Starter Plan
    console.log('Creating Starter Plan...');
    const starterProduct = await stripe.products.create({
      name: 'Starter Plan',
      description: 'Perfect for small businesses and individuals',
      metadata: {
        plan_type: 'starter',
        emails_per_month: '5000',
        contacts_limit: '2500',
        templates_limit: '10',
        campaigns_limit: '20',
        team_members: '3',
      },
    });

    const starterMonthly = await stripe.prices.create({
      product: starterProduct.id,
      currency: 'usd',
      unit_amount: 2900, // $29.00
      recurring: {
        interval: 'month',
      },
      metadata: {
        plan_type: 'starter',
        billing_cycle: 'monthly',
      },
    });

    const starterYearly = await stripe.prices.create({
      product: starterProduct.id,
      currency: 'usd',
      unit_amount: 29000, // $290.00
      recurring: {
        interval: 'year',
      },
      metadata: {
        plan_type: 'starter',
        billing_cycle: 'yearly',
      },
    });

    console.log(`✓ Starter Plan created`);
    console.log(`  Monthly Price ID: ${starterMonthly.id}`);
    console.log(`  Yearly Price ID: ${starterYearly.id}\n`);

    // Create Professional Plan
    console.log('Creating Professional Plan...');
    const professionalProduct = await stripe.products.create({
      name: 'Professional Plan',
      description: 'For growing businesses with advanced needs',
      metadata: {
        plan_type: 'professional',
        emails_per_month: '25000',
        contacts_limit: '10000',
        templates_limit: '50',
        campaigns_limit: '100',
        team_members: '10',
        custom_branding: 'true',
        priority_support: 'true',
      },
    });

    const professionalMonthly = await stripe.prices.create({
      product: professionalProduct.id,
      currency: 'usd',
      unit_amount: 7500, // $75.00
      recurring: {
        interval: 'month',
      },
      metadata: {
        plan_type: 'professional',
        billing_cycle: 'monthly',
      },
    });

    const professionalYearly = await stripe.prices.create({
      product: professionalProduct.id,
      currency: 'usd',
      unit_amount: 75000, // $750.00
      recurring: {
        interval: 'year',
      },
      metadata: {
        plan_type: 'professional',
        billing_cycle: 'yearly',
      },
    });

    console.log(`✓ Professional Plan created`);
    console.log(`  Monthly Price ID: ${professionalMonthly.id}`);
    console.log(`  Yearly Price ID: ${professionalYearly.id}\n`);

    // Create Enterprise Plan
    console.log('Creating Enterprise Plan...');
    const enterpriseProduct = await stripe.products.create({
      name: 'Enterprise Plan',
      description: 'For large organizations with unlimited needs',
      metadata: {
        plan_type: 'enterprise',
        emails_per_month: '100000',
        contacts_limit: '50000',
        templates_limit: '-1', // Unlimited
        campaigns_limit: '-1', // Unlimited
        team_members: '50',
        custom_branding: 'true',
        priority_support: 'true',
        api_access: 'true',
        advanced_analytics: 'true',
      },
    });

    const enterpriseMonthly = await stripe.prices.create({
      product: enterpriseProduct.id,
      currency: 'usd',
      unit_amount: 10000, // $100.00
      recurring: {
        interval: 'month',
      },
      metadata: {
        plan_type: 'enterprise',
        billing_cycle: 'monthly',
      },
    });

    const enterpriseYearly = await stripe.prices.create({
      product: enterpriseProduct.id,
      currency: 'usd',
      unit_amount: 100000, // $1,000.00
      recurring: {
        interval: 'year',
      },
      metadata: {
        plan_type: 'enterprise',
        billing_cycle: 'yearly',
      },
    });

    console.log(`✓ Enterprise Plan created`);
    console.log(`  Monthly Price ID: ${enterpriseMonthly.id}`);
    console.log(`  Yearly Price ID: ${enterpriseYearly.id}\n`);

    // Output environment variables
    console.log('========================================');
    console.log('Add these to your .env file:');
    console.log('========================================\n');
    console.log(`# Stripe Price IDs`);
    console.log(`STRIPE_PRICE_STARTER_MONTHLY=${starterMonthly.id}`);
    console.log(`STRIPE_PRICE_STARTER_YEARLY=${starterYearly.id}`);
    console.log(`STRIPE_PRICE_PROFESSIONAL_MONTHLY=${professionalMonthly.id}`);
    console.log(`STRIPE_PRICE_PROFESSIONAL_YEARLY=${professionalYearly.id}`);
    console.log(`STRIPE_PRICE_ENTERPRISE_MONTHLY=${enterpriseMonthly.id}`);
    console.log(`STRIPE_PRICE_ENTERPRISE_YEARLY=${enterpriseYearly.id}`);
    console.log('\n========================================');

  } catch (error) {
    console.error('Error creating Stripe products:', error);
    process.exit(1);
  }
}

// Run the setup
setupStripeProducts();