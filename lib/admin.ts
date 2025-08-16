export function isAdminEmail(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
  
  // Temporary debugging
  console.log('Admin check:', { 
    email, 
    adminEmails, 
    isAdmin: adminEmails.includes(email.toLowerCase()),
    env: process.env.NODE_ENV,
    hasAdminEmails: !!process.env.ADMIN_EMAILS
  });
  
  return adminEmails.includes(email.toLowerCase());
}


