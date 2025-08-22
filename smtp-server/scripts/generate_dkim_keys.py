#!/usr/bin/env python3
"""
Generate DKIM keys for a domain
Usage: python generate_dkim_keys.py yourdomain.com [selector]
"""

import os
import sys
import subprocess
from pathlib import Path

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.dkim_signer import DKIMSigner


def main():
    if len(sys.argv) < 2:
        print("Usage: python generate_dkim_keys.py yourdomain.com [selector]")
        sys.exit(1)
        
    domain = sys.argv[1]
    selector = sys.argv[2] if len(sys.argv) > 2 else "default"
    
    # Create directory for keys
    key_dir = Path(f"/etc/dkim/keys/{domain}")
    key_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"Generating DKIM keys for {domain} with selector '{selector}'...")
    
    # Generate keys
    signer = DKIMSigner()
    private_key, public_key = signer.generate_key_pair()
    
    # Save private key
    private_key_path = key_dir / "private.key"
    with open(private_key_path, 'w') as f:
        f.write(private_key)
    os.chmod(private_key_path, 0o600)
    
    # Save public key
    public_key_path = key_dir / "public.key"
    with open(public_key_path, 'w') as f:
        f.write(public_key)
        
    print(f"\nKeys generated successfully!")
    print(f"Private key: {private_key_path}")
    print(f"Public key: {public_key_path}")
    
    print(f"\nAdd this TXT record to your DNS:")
    print(f"Host: {selector}._domainkey.{domain}")
    print(f"Value: {public_key}")
    
    print(f"\nTo test your DKIM record:")
    print(f"dig TXT {selector}._domainkey.{domain}")


if __name__ == "__main__":
    main()