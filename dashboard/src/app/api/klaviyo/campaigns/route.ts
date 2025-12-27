import { NextResponse } from "next/server";

const KLAVIYO_API_KEY = process.env.KLAVIYO_API_KEY;
const KLAVIYO_BASE_URL = "https://a.klaviyo.com/api";

interface KlaviyoCampaign {
  type: string;
  id: string;
  attributes: {
    name: string;
    status: string;
    archived: boolean;
    audiences: {
      included: string[];
      excluded: string[];
    };
    send_options: {
      use_smart_sending: boolean;
    };
    tracking_options: {
      is_tracking_clicks: boolean;
      is_tracking_opens: boolean;
    };
    send_strategy: {
      method: string;
      options_static?: {
        datetime: string;
      };
    };
    created_at: string;
    updated_at: string;
    scheduled_at?: string;
    send_time?: string;
  };
}

interface KlaviyoMessage {
  type: string;
  id: string;
  attributes: {
    label: string;
    channel: string;
    content: {
      subject: string;
      preview_text: string;
      from_email: string;
      from_label: string;
    };
  };
}

export async function GET() {
  if (!KLAVIYO_API_KEY) {
    return NextResponse.json(
      {
        error: "Klaviyo API key not configured",
        fallback: true,
        data: []
      },
      { status: 200 }
    );
  }

  try {
    // Fetch campaigns from Klaviyo API
    const campaignsResponse = await fetch(
      `${KLAVIYO_BASE_URL}/campaigns?filter=equals(messages.channel,'email')&sort=-created_at&page[size]=20`,
      {
        headers: {
          Authorization: `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
          revision: "2024-10-15",
          Accept: "application/json",
        },
      }
    );

    if (!campaignsResponse.ok) {
      const errorText = await campaignsResponse.text();
      console.error("[Klaviyo API] Error:", campaignsResponse.status, errorText);
      return NextResponse.json(
        {
          error: `Klaviyo API error: ${campaignsResponse.status}`,
          fallback: true,
          data: []
        },
        { status: 200 }
      );
    }

    const campaignsData = await campaignsResponse.json();
    const campaigns: KlaviyoCampaign[] = campaignsData.data || [];

    // Transform Klaviyo data to our format
    const transformedCampaigns = campaigns.map((campaign) => {
      // Map Klaviyo status to our status
      let status: "draft" | "scheduled" | "sending" | "sent" | "paused" = "draft";
      switch (campaign.attributes.status) {
        case "Draft":
          status = "draft";
          break;
        case "Scheduled":
          status = "scheduled";
          break;
        case "Sending":
          status = "sending";
          break;
        case "Sent":
          status = "sent";
          break;
        case "Cancelled":
          status = "paused";
          break;
        default:
          status = "draft";
      }

      return {
        id: campaign.id,
        name: campaign.attributes.name,
        subject: "", // Will be fetched separately if needed
        status,
        type: "newsletter" as const,
        recipients: 0,
        sent: 0,
        opened: 0,
        clicked: 0,
        scheduledAt: campaign.attributes.scheduled_at || campaign.attributes.send_strategy?.options_static?.datetime,
        sentAt: campaign.attributes.send_time,
        createdAt: campaign.attributes.created_at,
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedCampaigns,
      count: transformedCampaigns.length,
      source: "klaviyo",
    });
  } catch (error) {
    console.error("[Klaviyo API] Exception:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        fallback: true,
        data: []
      },
      { status: 200 }
    );
  }
}
