# Type: agency
# Category: data
# Source: Alpha-Medical automation scripts
# Reusable: YES - Generic automation pattern
# ---
#!/usr/bin/env python3
"""
List Recent Customers to Find Test Customer
"""

import os
import json
import requests
from datetime import datetime, timedelta

# Load credentials
SHOPIFY_DOMAIN = "azffej-as.myshopify.com"

try:
    with open('.env.admin', 'r') as f:
        for line in f:
            if line.startswith('SHOPIFY_ADMIN_ACCESS_TOKEN='):
                SHOPIFY_TOKEN = line.split('=', 1)[1].strip()
                break
except:
    print("❌ Failed to load credentials")
    exit(1)

API_VERSION = "2025-10"
GRAPHQL_URL = f"https://{SHOPIFY_DOMAIN}/admin/api/{API_VERSION}/graphql.json"

HEADERS = {
    "X-Shopify-Access-Token": SHOPIFY_TOKEN,
    "Content-Type": "application/json"
}

def graphql_query(query):
    """Execute GraphQL query/mutation"""
    response = requests.post(GRAPHQL_URL, json={"query": query}, headers=HEADERS)
    if response.status_code != 200:
        print(f"❌ GraphQL Error: {response.status_code}")
        print(response.text)
        return None
    return response.json()

print("=" * 70)
print("RECENT CUSTOMERS (Last 10)")
print("=" * 70)

# Query recent customers
query = """
{
  customers(first: 10, reverse: true, sortKey: CREATED_AT) {
    edges {
      node {
        id
        email
        firstName
        lastName
        createdAt
        state
        emailMarketingConsent {
          marketingState
        }
      }
    }
  }
}
"""

result = graphql_query(query)

if not result or 'data' not in result:
    print("❌ Query failed")
    exit(1)

customers = result['data']['customers']['edges']

if len(customers) == 0:
    print("❌ No customers found")
    exit(1)

print(f"Found {len(customers)} recent customers")
print()

for edge in customers:
    customer = edge['node']
    print(f"ID: {customer['id']}")
    print(f"Email: {customer['email']}")
    print(f"Name: {customer['firstName']} {customer['lastName']}")
    print(f"Created: {customer['createdAt']}")
    print(f"State: {customer['state']}")
    print(f"Marketing: {customer['emailMarketingConsent']['marketingState']}")
    print("-" * 70)

print()
print("=" * 70)
print("LOOKING FOR TEST CUSTOMER")
print("=" * 70)

# Find test customers
test_customers = [
    edge['node'] for edge in customers
    if edge['node']['email'] and 'test+flow' in edge['node']['email']
]

if len(test_customers) == 0:
    print("❌ No test customers found with 'test+flow' in email")
    print()
    print("⚠️  Customer creation may have failed")
    print("⚠️  Or email field was not saved")
else:
    print(f"✅ Found {len(test_customers)} test customer(s)")
    print()
    for customer in test_customers:
        print(f"Email: {customer['email']}")
        print(f"Created: {customer['createdAt']}")
        print(f"Marketing: {customer['emailMarketingConsent']['marketingState']}")

print("=" * 70)
