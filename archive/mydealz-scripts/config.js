/**
 * MYDEALZ APIFY AUTOMATION - CONFIGURATION B2C
 *
 * ⚠️ IMPORTANT: MyDealz = B2C (Business-to-Consumer)
 * Target: END CONSUMERS, NOT businesses
 *
 * Last Updated: 2025-12-11 (Session 101 - B2C CORRECTION)
 */

module.exports = {
  // =============================================
  // BUSINESS MODEL
  // =============================================

  businessModel: {
    type: 'B2C',  // Business-to-Consumer
    target: 'End consumers who buy for personal use',
    NOT: 'Businesses, professionals, B2B leads'
  },

  // =============================================
  // PLATFORM PRIORITY (B2C)
  // =============================================

  platformPriority: {
    // FACEBOOK = PRIMARY (70% effort) - Best for B2C consumers
    facebook: {
      priority: 'PRIMARY',
      effort: '70%',
      reason: 'Best for B2C: Deals groups, Moms, Students, Fashion lovers',
      costPerLead: '$1.72',
      audience: 'Consumers looking for deals and products'
    },

    // INSTAGRAM = SECONDARY (20% effort) - Visual products
    instagram: {
      priority: 'SECONDARY',
      effort: '20%',
      reason: 'Visual products: Fashion, Lifestyle, Accessories',
      costPerLead: '$3-5',
      audience: 'Style-conscious consumers'
    },

    // TIKTOK = TERTIARY (10% effort) - Younger demographic
    tiktok: {
      priority: 'TERTIARY',
      effort: '10%',
      reason: 'Younger consumers, viral potential',
      costPerLead: '$2-4',
      audience: 'Gen Z and young millennials'
    },

    // LINKEDIN = SECONDARY for B2C (Consumer groups + Email extraction)
    linkedin: {
      priority: 'SECONDARY',
      effort: '30%',
      reason: 'Consumer passion groups (Fashion, Tech, Travel) + EMAIL extraction',
      costPerLead: '$3-10',
      note: 'Target CONSUMER groups (Fashion Lovers, Gadget Enthusiasts), NOT professional B2B groups',
      advantage: 'Email extraction via enrichment (Hunter, Apollo) - Facebook cannot do this'
    }
  },

  // =============================================
  // APIFY ACTOR IDs (B2C FOCUSED)
  // =============================================

  actors: {
    // FACEBOOK (PRIMARY - B2C) - 70% effort
    facebook: {
      // Group member scraper - Best for B2C communities
      groupScraper: 'apify/facebook-groups-scraper',
      // Page likes scraper - Consumer audiences
      pageScraper: 'apify/facebook-pages-scraper',
      // Profile scraper for enrichment
      profileScraper: 'apify/facebook-profile-scraper'
    },

    // LINKEDIN (SECONDARY - B2C Consumer Groups) - 30% effort
    // Target: Fashion/Tech/Travel ENTHUSIAST groups (consumers, NOT professionals)
    // Advantage: Email extraction via enrichment
    linkedin: {
      // Profile scraper - $3/1000 profiles, NO cookies required
      profileScraper: 'supreme_coder/linkedin-profile-scraper',
      // Profile search - Find consumers by interests
      profileSearch: 'harvestapi/linkedin-profile-search',
      // Bulk scraper - Enterprise grade with email enrichment
      bulkScraper: 'dev_fusion/linkedin-profile-scraper',
      // Email scraper - Dedicated email extraction
      emailScraper: 'bhansalisoft/linkedin-email-scraper',
      // Group members - Scrape passion group members
      groupScraper: 'bebity/linkedin-premium-actor'
    },

    // INSTAGRAM (TERTIARY - B2C)
    instagram: {
      // Hashtag scraper - Find consumers by interests
      hashtagScraper: 'apify/instagram-hashtag-scraper',
      // Profile scraper - Fashion/lifestyle followers
      profileScraper: 'apify/instagram-profile-scraper',
      // Comment scraper - Engaged consumers
      commentScraper: 'apify/instagram-comment-scraper'
    },

    // TIKTOK (QUATERNARY - B2C)
    tiktok: {
      // Profile scraper - Young consumers
      profileScraper: 'clockworks/tiktok-scraper',
      // Hashtag scraper - Trend followers
      hashtagScraper: 'clockworks/tiktok-hashtag-scraper'
    }
  },

  // =============================================
  // B2C TARGET SEGMENTS (MyDealz Products)
  // =============================================

  b2cSegments: {
    // Segment 1: DEAL HUNTERS (Transversal - all products)
    dealHunters: {
      description: 'Consumers actively looking for deals and discounts',
      products: 'ALL 271 products',
      priority: 'P0 - HIGHEST',
      keywords: ['deals', 'coupons', 'discount', 'sale', 'bargain', 'savings'],
      fbGroups: [
        'Canadian Deals and Coupons',
        'Extreme Couponing USA',
        'UK Deals and Discounts',
        'Frugal Living'
      ]
    },

    // Segment 2: FASHION LOVERS (66% of catalog)
    fashionLovers: {
      description: 'Style-conscious consumers interested in clothing and accessories',
      products: '180 products (Apparel, Fashion, Accessories)',
      priority: 'P0 - HIGHEST',
      keywords: ['fashion', 'style', 'clothing', 'outfit', 'wardrobe'],
      fbGroups: [
        'Canadian Winter Fashion',
        'Women\'s Fashion Buy Sell',
        'UK Women\'s Fashion'
      ]
    },

    // Segment 3: MOMS & FAMILIES (Multi-category buyers)
    momsAndFamilies: {
      description: 'Parents buying for family - high purchase frequency',
      products: 'ALL categories (gift buyers)',
      priority: 'P0 - HIGHEST',
      keywords: ['mom', 'family', 'kids', 'parenting', 'gift'],
      fbGroups: [
        'Canadian Moms',
        'Moms Who Save',
        'UK Mums Deals'
      ]
    },

    // Segment 4: STUDENTS (Budget-conscious)
    students: {
      description: 'University students - budget-conscious, tech-savvy',
      products: 'Tech, Bags, Apparel (budget-friendly)',
      priority: 'P1 - HIGH',
      keywords: ['student', 'university', 'college', 'budget'],
      fbGroups: [
        'Canadian University Students',
        'College Students Deals'
      ]
    },

    // Segment 5: TECH CONSUMERS (Not professionals!)
    techConsumers: {
      description: 'Consumers interested in gadgets and electronics for PERSONAL use',
      products: '29 Electronics products',
      priority: 'P1 - HIGH',
      keywords: ['gadget', 'tech deals', 'electronics', 'smart home'],
      fbGroups: [
        'Canadian Tech Deals',
        'Tech Deals USA',
        'Gadget Enthusiasts'
      ],
      note: 'NOT tech professionals - CONSUMERS who buy tech for personal use'
    },

    // Segment 6: HOME ENTHUSIASTS (Consumers, not businesses)
    homeEnthusiasts: {
      description: 'Consumers interested in home improvement and decor',
      products: '18 Home & Living products',
      priority: 'P1 - HIGH',
      keywords: ['home decor', 'DIY', 'home improvement', 'kitchen'],
      fbGroups: [
        'Canadian Home Decor',
        'Home Decor Ideas',
        'Kitchen Gadget Lovers'
      ]
    },

    // Segment 7: TRAVELERS (Personal travel, not business)
    travelers: {
      description: 'Consumers who travel for LEISURE, not business',
      products: '22 Travel products + 33 Bags',
      priority: 'P1 - HIGH',
      keywords: ['travel', 'vacation', 'road trip', 'adventure'],
      fbGroups: [
        'Canadian Travelers',
        'Travel Deals USA',
        'Backpacking Community'
      ],
      note: 'NOT business travelers - vacation and leisure travelers'
    }
  },

  // =============================================
  // LINKEDIN B2C CONSUMER GROUPS (To be identified manually)
  // =============================================

  linkedinConsumerGroups: {
    // NOTE: These are SEARCH TERMS to find groups manually on LinkedIn
    // Actual group names/URLs must be identified by user on linkedin.com/search/results/groups/

    fashion: {
      searchTerms: ['fashion enthusiasts', 'style lovers', 'sustainable fashion', 'winter fashion community'],
      knownPages: [
        { name: 'Sustainable Fashion Forum', followers: 59983, url: 'linkedin.com/company/the-sustainable-fashion-forum' },
        { name: 'Fashion Buyers Network', followers: 5294, url: 'linkedin.com/company/fashion-buyers-network' }
      ],
      targetGroupCount: 20,
      status: 'MANUAL_SEARCH_REQUIRED'
    },

    tech: {
      searchTerms: ['tech gadgets enthusiasts', 'electronics lovers', 'smart home community', 'gadget lovers'],
      knownPages: [
        { name: 'Global Tech Gadgets', followers: 399, url: 'linkedin.com/company/globaltechgadgets' },
        { name: 'TECH 2025', followers: 'unknown', url: 'linkedin.com/company/tech-2025' }
      ],
      targetGroupCount: 20,
      status: 'MANUAL_SEARCH_REQUIRED'
    },

    bags: {
      searchTerms: ['travel bag enthusiasts', 'backpack community', 'luggage lovers', 'travel accessories'],
      knownPages: [
        { name: 'Samsonite', followers: 'large', note: 'Followers = potential bag buyers' },
        { name: 'Away', followers: 'large', note: 'Modern travel brand followers' }
      ],
      targetGroupCount: 20,
      status: 'MANUAL_SEARCH_REQUIRED'
    },

    home: {
      searchTerms: ['home decor enthusiasts', 'interior design lovers', 'smart home', 'DIY home'],
      knownPages: [
        { name: 'Interior Design Society', followers: 19600, url: 'linkedin.com/company/interior-design-society' }
      ],
      targetGroupCount: 20,
      status: 'MANUAL_SEARCH_REQUIRED'
    },

    travel: {
      searchTerms: ['travel enthusiasts', 'adventure travelers', 'backpacking community', 'vacation planning'],
      knownPages: [],
      targetGroupCount: 20,
      status: 'MANUAL_SEARCH_REQUIRED'
    }
  },

  // =============================================
  // FACEBOOK GROUPS BY COUNTRY (B2C)
  // =============================================

  facebookGroups: {
    canada: {
      deals: [
        { name: 'Canadian Deals and Coupons', members: '50K-200K', priority: 'P0' },
        { name: 'Canada Freebies and Deals', members: '30K-100K', priority: 'P0' },
        { name: 'RedFlagDeals Community', members: '20K-50K', priority: 'P0' },
        { name: 'Frugal Canadians', members: '10K-30K', priority: 'P1' }
      ],
      fashion: [
        { name: 'Canadian Winter Fashion', members: '5K-20K', priority: 'P0' },
        { name: 'Canada Women\'s Clothing Buy Sell', members: '10K-50K', priority: 'P0' },
        { name: 'Toronto Fashion Exchange', members: '10K-30K', priority: 'P0' }
      ],
      moms: [
        { name: 'Canadian Moms', members: '50K-150K', priority: 'P0' },
        { name: 'GTA Moms Buy Sell', members: '10K-40K', priority: 'P0' },
        { name: 'Montreal Mamas', members: '10K-30K', priority: 'P0' }
      ],
      tech: [
        { name: 'Canadian Tech Deals', members: '20K-80K', priority: 'P0' },
        { name: 'Canada Electronics Buy Sell', members: '30K-100K', priority: 'P0' }
      ],
      students: [
        { name: 'Canadian University Students', members: '50K-150K', priority: 'P0' },
        { name: 'UofT Students Buy Sell', members: '10K-40K', priority: 'P1' }
      ]
    },

    usa: {
      deals: [
        { name: 'Extreme Couponing USA', members: '100K-500K', priority: 'P0' },
        { name: 'Online Deals & Steals', members: '50K-200K', priority: 'P0' },
        { name: 'Frugal Living USA', members: '30K-100K', priority: 'P0' }
      ],
      fashion: [
        { name: 'Women\'s Fashion Buy Sell USA', members: '50K-200K', priority: 'P0' },
        { name: 'Winter Fashion USA', members: '10K-50K', priority: 'P0' }
      ],
      moms: [
        { name: 'Moms Who Save', members: '100K-300K', priority: 'P0' },
        { name: 'Frugal Moms USA', members: '50K-150K', priority: 'P0' }
      ],
      tech: [
        { name: 'Tech Deals USA', members: '100K-500K', priority: 'P0' },
        { name: 'Gadget Enthusiasts', members: '30K-100K', priority: 'P0' }
      ]
    },

    uk: {
      deals: [
        { name: 'UK Deals and Discounts', members: '50K-200K', priority: 'P0' },
        { name: 'British Bargain Hunters', members: '30K-100K', priority: 'P1' }
      ],
      fashion: [
        { name: 'UK Women\'s Fashion Buy Sell', members: '50K-150K', priority: 'P0' }
      ],
      moms: [
        { name: 'UK Mums Deals', members: '30K-100K', priority: 'P1' }
      ]
    }
  },

  // =============================================
  // B2C LEAD SCORING (Consumer-focused)
  // =============================================

  leadScoring: {
    b2c: {
      // Location (30 points max) - Shipping feasibility
      location: {
        'Canada': 30,      // PRIMARY market
        'United States': 25,
        'United Kingdom': 20,
        'Europe': 15,
        'default': 10
      },

      // Consumer Segment (25 points max)
      segment: {
        'Deal Hunter': 25,     // Highest intent to buy
        'Mom/Family': 25,      // High purchase frequency
        'Fashion Lover': 20,   // Core product match
        'Student': 15,         // Budget-conscious
        'Tech Consumer': 15,   // Niche but engaged
        'default': 10
      },

      // Group Relevance (25 points max)
      groupRelevance: {
        'P0': 25,   // Primary target groups
        'P1': 15,   // Secondary groups
        'P2': 10,   // Tertiary groups
        'default': 5
      },

      // Engagement Signals (20 points max)
      engagement: {
        'Recent Join (30 days)': 20,
        'Active Commenter': 15,
        'Profile Complete': 10,
        'default': 5
      }
    },

    // DEPRECATED - DO NOT USE FOR B2C
    b2b_DEPRECATED: {
      warning: 'LinkedIn B2B scoring is NOT for MyDealz B2C model',
      doNotUse: true
    }
  },

  // =============================================
  // SCRAPER SETTINGS (B2C Optimized)
  // =============================================

  scraperSettings: {
    facebook: {
      maxMembersPerGroup: 10000,  // FB limit
      minGroupSize: 1000,
      delayBetweenRequests: 3000, // 3 seconds (avoid ban)
      dailyLimit: 50000,          // 50K profiles/day
      preferredTool: 'Instant Data Scraper (Chrome)'
    },

    instagram: {
      maxFollowersPerScrape: 5000,
      minFollowers: 100,          // Real consumers
      maxFollowers: 50000,        // Not influencers/brands
      engagement: {
        minLikes: 10,
        maxComments: 1000
      }
    },

    tiktok: {
      maxFollowersPerScrape: 3000,
      targetAgeGroup: '18-35',
      contentType: ['fashion', 'deals', 'haul', 'unboxing']
    }
  },

  // =============================================
  // GOOGLE SHEETS OUTPUT (B2C Structure)
  // =============================================

  sheetsConfig: {
    spreadsheetId: process.env.GOOGLE_SHEETS_ID || '1uEYLQHfZbw_Y5CCBKU4sIF6RnD1jpWoDmDtDINnjp7w',

    tabs: {
      // B2C Consumer leads
      rawLeads: 'RAW LEADS',
      qualified: 'QUALIFIED',
      contacted: 'CONTACTED',

      // Platform-specific
      facebookRaw: 'FACEBOOK_RAW',
      facebookQualified: 'FACEBOOK_QUALIFIED',
      instagramRaw: 'INSTAGRAM_RAW',
      tiktokRaw: 'TIKTOK_RAW'
    },

    // B2C Consumer columns
    b2cColumns: [
      'source_platform',      // Facebook/Instagram/TikTok
      'source_group',         // Group name
      'source_country',       // CA/US/UK
      'source_segment',       // Deal Hunter/Mom/Fashion/etc.
      'profile_id',
      'full_name',
      'profile_url',
      'bio',
      'location',
      'interests',            // Detected from bio/groups
      'join_date',
      'scraped_date',
      'lead_score',           // B2C scoring (0-100)
      'segment_match',        // Which B2C segment
      'status'                // New/Contacted/Converted
    ]
  },

  // =============================================
  // B2C MESSAGE TEMPLATES
  // =============================================

  messageTemplates: {
    dealHunter: `Hey [NAME]! 👋 I noticed you're into finding great deals.
Check out mydealz.shop - we have amazing prices on winter coats,
bags, and tech gadgets. Free shipping over $150! 🇨🇦
[LINK]`,

    fashionLover: `Hi [NAME]! Love your style! 💜
We just got new winter fashion at mydealz.shop -
premium quality coats and accessories at great prices.
Take a look! [LINK]`,

    mom: `Hi [NAME]! 🎁 As a fellow parent, I thought you'd appreciate
mydealz.shop - great deals on winter coats, bags,
and gifts for the family. Fast Canadian shipping!
[LINK]`,

    student: `Hey [NAME]! 📚 Student budget-friendly alert!
mydealz.shop has affordable tech, backpacks, and winter gear.
Quality stuff without breaking the bank!
[LINK]`,

    techConsumer: `Hi [NAME]! Saw you're into tech gadgets.
mydealz.shop has great deals on electronics,
wireless headphones, and smart home stuff.
Worth checking out! [LINK]`
  }
};
