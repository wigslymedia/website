# Portfolio Showcase Website

A modern, metallic-themed portfolio showcase website built with pure HTML5, CSS3, and vanilla JavaScript.

## Pages

- **Home** (`index.html`) - Hero section with featured portfolio grid
- **Gallery** (`gallery.html`) - Full portfolio gallery with all 44 images and lightbox functionality
- **Contact** (`contact.html`) - Contact form for portfolio inquiries and commissions

## Tech Stack

- Pure HTML5, CSS3, JavaScript (no frameworks)
- Google Fonts (Exo 2, Rajdhani)
- Responsive design
- CSS animations and gradients
- GitHub Pages compatible

## Design

- Dark slate/navy backgrounds (#0f1419, #1a1f2e)
- Metallic silver-to-chrome gradients
- Blue accent highlights (#4a9eff)
- Angular, industrial aesthetic matching the portfolio logo

## Features

- **Responsive Gallery** - Grid layout with lightbox for viewing images
- **Smooth Animations** - Scroll-triggered fade-in animations
- **Mobile Menu** - Hamburger menu for mobile navigation
- **Contact Form** - Webforms integration ready
- **Lazy Loading** - Images load as you scroll for better performance
- **Keyboard Navigation** - Arrow keys and Escape for lightbox navigation

## Deployment

### GitHub Pages

1. Push the `portfolio-site` folder contents to your GitHub repository
2. Enable GitHub Pages in repository settings
3. Select the branch and folder containing the site
4. Your site will be available at `https://username.github.io/repository-name/`

### Cloudflare Setup

- Configure Cloudflare WAF and security headers
- Set up Cloud Workers if needed
- Point domain to GitHub Pages

### Webforms Configuration

Update the form action URL in `contact.html`:
```html
<form action="https://webforms.pipedream.com/f/your-form-id" method="POST">
```

Replace `your-form-id` with your actual Webforms endpoint.

## File Structure

```
portfolio-site/
├── index.html              # Homepage
├── gallery.html            # Full gallery
├── contact.html            # Contact form
├── assets/
│   ├── css/
│   │   └── style.css       # Main stylesheet
│   ├── js/
│   │   └── main.js         # JavaScript functionality
│   └── images/
│       ├── logo.png        # Portfolio logo
│       └── photos/         # All portfolio images (44 images)
├── favicon.svg             # Site favicon
├── manifest.json           # PWA manifest
├── robots.txt              # SEO robots file
├── sitemap.xml             # Site structure for SEO
└── README.md               # This file
```

## Customization

### Update Domain

Replace `yourdomain.com` in:
- `sitemap.xml`
- `robots.txt`

### Update Contact Information

Edit contact details in `contact.html`:
- Email address
- Form endpoint URL

### Add/Remove Images

1. Add new images to `assets/images/photos/`
2. Update `gallery.html` with new image entries
3. Update image count in gallery info text

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

© 2025 Portfolio Showcase

