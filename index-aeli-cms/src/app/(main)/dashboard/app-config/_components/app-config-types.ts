export interface AppConfigCredentialItem {
  icon: string;
  title: string;
  desc: string;
}

export interface AppConfigFooterLink {
  label: string;
  url: string;
}

export interface AppConfigBusinessHours {
  weekday: string;
  saturday: string;
  sunday: string;
}

export interface AppConfigContact {
  title: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  business_hours: AppConfigBusinessHours;
}

export interface AppConfigTeamMember {
  name: string;
  role: string;
  image: string;
  bio: string;
}

export interface AppConfigValueItem {
  icon: string;
  title: string;
  desc: string;
}

export interface AppConfigAbout {
  badge: string;
  title: string;
  description_1: string;
  description_2: string;
  image: string;
  vision_title: string;
  vision_desc: string;
  mission_title: string;
  mission_desc: string;
  values_badge: string;
  values_title: string;
  values: AppConfigValueItem[];
  team_badge: string;
  team_title: string;
  team_members: AppConfigTeamMember[];
}

export interface AppConfigData {
  tax_percent: number;
  platform_fee_percent?: number;
  credentials: {
    subtitle: string;
    title: string;
    items: AppConfigCredentialItem[];
  };
  contact: AppConfigContact;
  about: AppConfigAbout;
  footer: {
    brand_description: string;
    address: string;
    phone: string;
    email: string;
    quick_links: AppConfigFooterLink[];
    support_links: AppConfigFooterLink[];
    copyright_text: string;
  };
}

export const DEFAULT_APP_CONFIG: AppConfigData = {
  tax_percent: 10,
  platform_fee_percent: 5,
  credentials: {
    subtitle: "Our Credentials",
    title: "A World of Wonders Awaits",
    items: [
      {
        icon: "Map",
        title: "Discover Hidden Gems",
        desc: "Explore Indonesia's untouched corners and secret spots, far from the usual tourist trails.",
      },
      {
        icon: "Compass",
        title: "Explore Unique Experiences",
        desc: "Authentic adventures curated to showcase Indonesia's rich culture and vibrant nature.",
      },
      {
        icon: "Users",
        title: "Connect Local Cultures",
        desc: "Support local communities through tourism. We champion homestays, local guides, and community-based enterprises to ensure your trip gives back directly to the people and places you visit. Experience genuine hospitality and preserve Indonesia's cultural heritage together.",
      },
      {
        icon: "Trees",
        title: "Sustain For Better Future",
        desc: "Protect the environment and support local communities through responsible tourism. We partner with eco-conscious operators, minimize waste, and promote conservation efforts to ensure your journey contributes to a sustainable future for Indonesia's natural treasures.",
      },
    ],
  },
  contact: {
    title: "Get in Touch",
    description:
      "Have questions about our programs, destinations, or want to customize your journey? Our team of local experts is ready to help you plan the perfect Indonesian adventure.",
    address: "Kuningan Cyber, Block C2-12, South Jakarta, Indonesia",
    phone: "+62 (21) 8000-AELI",
    email: "explore@index-aeli.id",
    business_hours: {
      weekday: "09:00 - 18:00 (WIB)",
      saturday: "10:00 - 15:00 (WIB)",
      sunday: "Closed",
    },
  },
  about: {
    badge: "Who We Are",
    title: "Indonesia Destination-Based Exploration",
    description_1:
      "INDEX-AELI is Indonesia's premier tourism landing platform. In partnership with AELI (Asosiasi Experiential Learning Indonesia), we connect worldwide travelers with curated premium programs and unforgettable tropical attractions across the Indonesian archipelago.",
    description_2:
      "We believe in tourism that gives back. By working with certified local guides and eco-friendly accommodation partners, we ensure that your luxury journey contributes directly to local economies and environment preservation.",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&fit=crop",
    vision_title: "Our Vision",
    vision_desc:
      "To be the leading platform for experiential learning and luxury destination tourism in Indonesia, empowering travelers to explore the archipelago authentically, responsibly, and deeply.",
    mission_title: "Our Mission",
    mission_desc:
      "To design top-tier travel itineraries with local guides, establish high safety compliance benchmarks under CHSE, and promote eco-sustainable tourism values that nourish communities.",
    values_badge: "Our values",
    values_title: "How We Create Adventures",
    values: [
      {
        icon: "Map",
        title: "Discover Hidden Gems",
        desc: "Explore Indonesia’s untouched corners and secret spots, far from the usual tourist trails.",
      },
      {
        icon: "Compass",
        title: "Explore Unique Experiences",
        desc: "Authentic adventures curated to showcase Indonesia’s rich culture and vibrant nature.",
      },
      {
        icon: "Users",
        title: "Connect Local Cultures",
        desc: "Support local communities through tourism. We champion homestays, local guides, and community-based enterprises.",
      },
      {
        icon: "Heart",
        title: "Sustain For Better Future",
        desc: "Protect the environment and support local communities through responsible, eco-conscious tourism.",
      },
    ],
    team_badge: "The Curators",
    team_title: "Meet Our Leadership",
    team_members: [
      {
        name: "Budi Santoso",
        role: "Co-Founder & CEO",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
        bio: "Budi has over 15 years of tourism management experience across Bali, Komodo, and Raja Ampat.",
      },
      {
        name: "Dewi Lestari",
        role: "Head of Operations",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
        bio: "Dewi ensures all itineraries meet CHSE safety regulations and connect directly with local communities.",
      },
      {
        name: "Agus Pratama",
        role: "Local Guide Lead Curator",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
        bio: "Agus collaborates with community heads and local guides to deliver authentic experiences.",
      },
    ],
  },
  footer: {
    brand_description:
      "INDEX-AELI is Indonesia's premier tourism landing platform. We connect worldwide travelers with curated premium program and unforgettable tropical attractions across the Indonesian archipelago.",
    address: "Kuningan Cyber, Block C2-12, South Jakarta, Indonesia",
    phone: "+62 (21) 8000-AELI",
    email: "explore@index-aeli.id",
    quick_links: [
      { label: "Popular Destinations", url: "/#destinations" },
      { label: "Top Attractions", url: "/#attractions" },
      { label: "Curated Programs", url: "/#program" },
      { label: "About INDEX-AELI", url: "/#about" },
      { label: "Secure Booking", url: "/booking" },
    ],
    support_links: [
      { label: "Help Center / FAQ", url: "#" },
      { label: "Safety Guidelines", url: "#" },
      { label: "Terms of Service", url: "#" },
      { label: "Privacy Policy", url: "#" },
      { label: "Refund & Cancellation Policy", url: "#" },
    ],
    copyright_text: "INDEX-AELI Indonesia. All rights reserved.",
  },
};

