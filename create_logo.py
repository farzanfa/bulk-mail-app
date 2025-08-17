#!/usr/bin/env python3
"""
Logo Generator - Creates a unique, modern geometric logo design
"""

from PIL import Image, ImageDraw, ImageFont
import math
import random
from datetime import datetime

def create_logo(size=800, output_file="logo.png"):
    """
    Creates a unique geometric logo with a modern design
    """
    # Create a new image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Center point
    center_x = size // 2
    center_y = size // 2
    
    # Color palette - Modern gradient colors
    primary_color = (71, 118, 230)  # Royal blue
    secondary_color = (142, 84, 233)  # Purple
    accent_color = (255, 255, 255)  # White
    
    # Create a unique pattern based on current timestamp for uniqueness
    seed = int(datetime.now().timestamp())
    random.seed(seed)
    
    # Draw the main logo shape - Interconnected geometric design
    # Outer circle with gradient effect
    for i in range(50, 0, -1):
        alpha = int(255 * (i / 50))
        color = (*primary_color, alpha)
        draw.ellipse([center_x - (size//3 + i), center_y - (size//3 + i),
                     center_x + (size//3 + i), center_y + (size//3 + i)],
                    fill=color)
    
    # Draw inner geometric pattern - Abstract hexagon with connections
    num_points = 6
    radius = size // 4
    points = []
    
    for i in range(num_points):
        angle = (2 * math.pi / num_points) * i - math.pi / 2
        x = center_x + radius * math.cos(angle)
        y = center_y + radius * math.sin(angle)
        points.append((x, y))
    
    # Draw connecting lines with gradient
    for i in range(num_points):
        for j in range(i + 1, num_points):
            # Create gradient effect on lines
            for k in range(5):
                alpha = 255 - (k * 30)
                width = 8 - k
                draw.line([points[i], points[j]], 
                         fill=(*secondary_color, alpha), 
                         width=width)
    
    # Draw center focal point
    focal_radius = size // 8
    
    # Outer glow
    for i in range(30, 0, -1):
        alpha = int(200 * (i / 30))
        draw.ellipse([center_x - focal_radius - i, center_y - focal_radius - i,
                     center_x + focal_radius + i, center_y + focal_radius + i],
                    fill=(*accent_color, alpha))
    
    # Inner circle with gradient
    for i in range(focal_radius, 0, -1):
        progress = i / focal_radius
        r = int(primary_color[0] * (1 - progress) + secondary_color[0] * progress)
        g = int(primary_color[1] * (1 - progress) + secondary_color[1] * progress)
        b = int(primary_color[2] * (1 - progress) + secondary_color[2] * progress)
        draw.ellipse([center_x - i, center_y - i,
                     center_x + i, center_y + i],
                    fill=(r, g, b, 255))
    
    # Add subtle details - small accent dots
    detail_radius = 5
    for point in points:
        draw.ellipse([point[0] - detail_radius, point[1] - detail_radius,
                     point[0] + detail_radius, point[1] + detail_radius],
                    fill=accent_color)
    
    # Save the logo
    img.save(output_file, 'PNG', quality=100)
    print(f"Logo saved as {output_file}")
    
    # Create additional versions
    create_logo_variants(img)

def create_logo_variants(original_img):
    """
    Creates different size variants of the logo
    """
    sizes = {
        'logo_small.png': 200,
        'logo_medium.png': 400,
        'logo_large.png': 1200,
        'logo_icon.png': 64,
        'logo_favicon.png': 32
    }
    
    for filename, size in sizes.items():
        resized = original_img.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(filename, 'PNG', quality=100)
        print(f"Created variant: {filename} ({size}x{size})")

def create_logo_with_text(size=800, text="BRAND", output_file="logo_with_text.png"):
    """
    Creates a version of the logo with brand text
    """
    # Create base logo
    img = Image.new('RGBA', (size, int(size * 1.2)), (0, 0, 0, 0))
    
    # Load the original logo
    logo_img = Image.open("logo.png")
    logo_size = int(size * 0.7)
    logo_img = logo_img.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
    
    # Paste logo centered horizontally, slightly up
    logo_x = (size - logo_size) // 2
    logo_y = int(size * 0.05)
    img.paste(logo_img, (logo_x, logo_y), logo_img)
    
    # Add text below logo
    draw = ImageDraw.Draw(img)
    
    # Try to use a modern font, fallback to default if not available
    font_size = int(size * 0.12)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    # Calculate text position
    text_bbox = draw.textbbox((0, 0), text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    
    text_x = (size - text_width) // 2
    text_y = logo_y + logo_size + int(size * 0.05)
    
    # Draw text with slight shadow effect
    shadow_offset = 2
    draw.text((text_x + shadow_offset, text_y + shadow_offset), text, 
              fill=(0, 0, 0, 100), font=font)
    draw.text((text_x, text_y), text, 
              fill=(71, 118, 230, 255), font=font)
    
    img.save(output_file, 'PNG', quality=100)
    print(f"Logo with text saved as {output_file}")

if __name__ == "__main__":
    print("Generating unique logo design...")
    print("=" * 50)
    
    # Create main logo
    create_logo()
    
    # Create logo with text
    create_logo_with_text()
    
    print("\n" + "=" * 50)
    print("Logo generation complete!")
    print("\nGenerated files:")
    print("- logo.png (Main logo)")
    print("- logo_with_text.png (Logo with brand text)")
    print("- logo_small.png (200x200)")
    print("- logo_medium.png (400x400)")
    print("- logo_large.png (1200x1200)")
    print("- logo_icon.png (64x64)")
    print("- logo_favicon.png (32x32)")