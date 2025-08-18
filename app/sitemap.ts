import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://mailweaver.farzanfa.com';
  
  // Define your static routes
  const staticRoutes = [
    '',
    '/about',
    '/pricing',
    '/templates',
    '/why-us',
    '/support',
    '/privacy',
    '/terms',
    '/refund',
  ];
  
  // Generate sitemap entries for static routes
  const staticPages = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1 : 0.8,
  }));
  
  // You can add dynamic routes here in the future
  // For example, fetch template pages from database
  
  return [
    ...staticPages,
    // Add more dynamic routes as needed
  ];
}