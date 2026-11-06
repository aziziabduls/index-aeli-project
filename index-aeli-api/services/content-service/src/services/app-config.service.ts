import { pool } from '../db.js';
import { AppError } from '../errors.js';

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
    subtitle: 'Our Credentials',
    title: 'A World of Wonders Awaits',
    items: [
      {
        icon: 'Map',
        title: 'Discover Hidden Gems',
        desc: "Explore Indonesia's untouched corners and secret spots, far from the usual tourist trails.",
      },
      {
        icon: 'Compass',
        title: 'Explore Unique Experiences',
        desc: "Authentic adventures curated to showcase Indonesia's rich culture and vibrant nature.",
      },
      {
        icon: 'Users',
        title: 'Connect Local Cultures',
        desc: "Support local communities through tourism. We champion homestays, local guides, and community-based enterprises to ensure your trip gives back directly to the people and places you visit. Experience genuine hospitality and preserve Indonesia's cultural heritage together.",
      },
      {
        icon: 'Trees',
        title: 'Sustain For Better Future',
        desc: "Protect the environment and support local communities through responsible tourism. We partner with eco-conscious operators, minimize waste, and promote conservation efforts to ensure your journey contributes to a sustainable future for Indonesia's natural treasures.",
      },
    ],
  },
  contact: {
    title: 'Get in Touch',
    description:
      'Have questions about our programs, destinations, or want to customize your journey? Our team of local experts is ready to help you plan the perfect Indonesian adventure.',
    address: 'Kuningan Cyber, Block C2-12, South Jakarta, Indonesia',
    phone: '+62 (21) 8000-AELI',
    email: 'explore@index-aeli.id',
    business_hours: {
      weekday: '09:00 - 18:00 (WIB)',
      saturday: '10:00 - 15:00 (WIB)',
      sunday: 'Closed',
    },
  },
  about: {
    badge: 'Who We Are',
    title: 'Indonesia Destination-Based Exploration',
    description_1:
      "INDEX-AELI is Indonesia's premier tourism landing platform. In partnership with AELI (Asosiasi Experiential Learning Indonesia), we connect worldwide travelers with curated premium programs and unforgettable tropical attractions across the Indonesian archipelago.",
    description_2:
      'We believe in tourism that gives back. By working with certified local guides and eco-friendly accommodation partners, we ensure that your luxury journey contributes directly to local economies and environment preservation.',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&fit=crop',
    vision_title: 'Our Vision',
    vision_desc:
      'To be the leading platform for experiential learning and luxury destination tourism in Indonesia, empowering travelers to explore the archipelago authentically, responsibly, and deeply.',
    mission_title: 'Our Mission',
    mission_desc:
      'To design top-tier travel itineraries with local guides, establish high safety compliance benchmarks under CHSE, and promote eco-sustainable tourism values that nourish communities.',
    values_badge: 'Our values',
    values_title: 'How We Create Adventures',
    values: [
      {
        icon: 'Map',
        title: 'Discover Hidden Gems',
        desc: 'Explore Indonesia’s untouched corners and secret spots, far from the usual tourist trails.',
      },
      {
        icon: 'Compass',
        title: 'Explore Unique Experiences',
        desc: 'Authentic adventures curated to showcase Indonesia’s rich culture and vibrant nature.',
      },
      {
        icon: 'Users',
        title: 'Connect Local Cultures',
        desc: 'Support local communities through tourism. We champion homestays, local guides, and community-based enterprises.',
      },
      {
        icon: 'Heart',
        title: 'Sustain For Better Future',
        desc: 'Protect the environment and support local communities through responsible, eco-conscious tourism.',
      },
    ],
    team_badge: 'The Curators',
    team_title: 'Meet Our Leadership',
    team_members: [
      {
        name: 'Budi Santoso',
        role: 'Co-Founder & CEO',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
        bio: 'Budi has over 15 years of tourism management experience across Bali, Komodo, and Raja Ampat.',
      },
      {
        name: 'Dewi Lestari',
        role: 'Head of Operations',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
        bio: 'Dewi ensures all itineraries meet CHSE safety regulations and connect directly with local communities.',
      },
      {
        name: 'Agus Pratama',
        role: 'Local Guide Lead Curator',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
        bio: 'Agus collaborates with community heads and local guides to deliver authentic experiences.',
      },
    ],
  },
  footer: {
    brand_description:
      "INDEX-AELI is Indonesia's premier tourism landing platform. We connect worldwide travelers with curated premium program and unforgettable tropical attractions across the Indonesian archipelago.",
    address: 'Kuningan Cyber, Block C2-12, South Jakarta, Indonesia',
    phone: '+62 (21) 8000-AELI',
    email: 'explore@index-aeli.id',
    quick_links: [
      { label: 'Popular Destinations', url: '/#destinations' },
      { label: 'Top Attractions', url: '/#attractions' },
      { label: 'Curated Programs', url: '/#program' },
      { label: 'About INDEX-AELI', url: '/#about' },
      { label: 'Secure Booking', url: '/booking' },
    ],
    support_links: [
      { label: 'Help Center / FAQ', url: '#' },
      { label: 'Safety Guidelines', url: '#' },
      { label: 'Terms of Service', url: '#' },
      { label: 'Privacy Policy', url: '#' },
      { label: 'Refund & Cancellation Policy', url: '#' },
    ],
    copyright_text: 'INDEX-AELI Indonesia. All rights reserved.',
  },
};

export class AppConfigService {
  async getAppConfig(): Promise<AppConfigData> {
    const { rows } = await pool.query('SELECT config FROM content.app_config WHERE id = 1 LIMIT 1;');
    if (rows.length === 0 || !rows[0].config) {
      return DEFAULT_APP_CONFIG;
    }

    const stored = rows[0].config as Partial<AppConfigData>;
    return {
      tax_percent:
        typeof stored.tax_percent === 'number' && !Number.isNaN(stored.tax_percent)
          ? stored.tax_percent
          : DEFAULT_APP_CONFIG.tax_percent,
      platform_fee_percent:
        typeof stored.platform_fee_percent === 'number' && !Number.isNaN(stored.platform_fee_percent)
          ? stored.platform_fee_percent
          : (DEFAULT_APP_CONFIG.platform_fee_percent ?? 5),
      credentials: {
        subtitle: stored.credentials?.subtitle ?? DEFAULT_APP_CONFIG.credentials.subtitle,
        title: stored.credentials?.title ?? DEFAULT_APP_CONFIG.credentials.title,
        items:
          Array.isArray(stored.credentials?.items) && stored.credentials.items.length > 0
            ? stored.credentials.items
            : DEFAULT_APP_CONFIG.credentials.items,
      },
      contact: {
        title: stored.contact?.title ?? DEFAULT_APP_CONFIG.contact.title,
        description: stored.contact?.description ?? DEFAULT_APP_CONFIG.contact.description,
        address:
          stored.contact?.address ?? stored.footer?.address ?? DEFAULT_APP_CONFIG.contact.address,
        phone: stored.contact?.phone ?? stored.footer?.phone ?? DEFAULT_APP_CONFIG.contact.phone,
        email: stored.contact?.email ?? stored.footer?.email ?? DEFAULT_APP_CONFIG.contact.email,
        business_hours: {
          weekday:
            stored.contact?.business_hours?.weekday ??
            DEFAULT_APP_CONFIG.contact.business_hours.weekday,
          saturday:
            stored.contact?.business_hours?.saturday ??
            DEFAULT_APP_CONFIG.contact.business_hours.saturday,
          sunday:
            stored.contact?.business_hours?.sunday ??
            DEFAULT_APP_CONFIG.contact.business_hours.sunday,
        },
      },
      about: {
        badge: stored.about?.badge ?? DEFAULT_APP_CONFIG.about.badge,
        title: stored.about?.title ?? DEFAULT_APP_CONFIG.about.title,
        description_1: stored.about?.description_1 ?? DEFAULT_APP_CONFIG.about.description_1,
        description_2: stored.about?.description_2 ?? DEFAULT_APP_CONFIG.about.description_2,
        image: stored.about?.image ?? DEFAULT_APP_CONFIG.about.image,
        vision_title: stored.about?.vision_title ?? DEFAULT_APP_CONFIG.about.vision_title,
        vision_desc: stored.about?.vision_desc ?? DEFAULT_APP_CONFIG.about.vision_desc,
        mission_title: stored.about?.mission_title ?? DEFAULT_APP_CONFIG.about.mission_title,
        mission_desc: stored.about?.mission_desc ?? DEFAULT_APP_CONFIG.about.mission_desc,
        values_badge: stored.about?.values_badge ?? DEFAULT_APP_CONFIG.about.values_badge,
        values_title: stored.about?.values_title ?? DEFAULT_APP_CONFIG.about.values_title,
        values:
          Array.isArray(stored.about?.values) && stored.about.values.length > 0
            ? stored.about.values
            : DEFAULT_APP_CONFIG.about.values,
        team_badge: stored.about?.team_badge ?? DEFAULT_APP_CONFIG.about.team_badge,
        team_title: stored.about?.team_title ?? DEFAULT_APP_CONFIG.about.team_title,
        team_members:
          Array.isArray(stored.about?.team_members) && stored.about.team_members.length > 0
            ? stored.about.team_members
            : DEFAULT_APP_CONFIG.about.team_members,
      },
      footer: {
        brand_description:
          stored.footer?.brand_description ?? DEFAULT_APP_CONFIG.footer.brand_description,
        address: stored.footer?.address ?? DEFAULT_APP_CONFIG.footer.address,
        phone: stored.footer?.phone ?? DEFAULT_APP_CONFIG.footer.phone,
        email: stored.footer?.email ?? DEFAULT_APP_CONFIG.footer.email,
        quick_links: Array.isArray(stored.footer?.quick_links)
          ? stored.footer.quick_links
          : DEFAULT_APP_CONFIG.footer.quick_links,
        support_links: Array.isArray(stored.footer?.support_links)
          ? stored.footer.support_links
          : DEFAULT_APP_CONFIG.footer.support_links,
        copyright_text: stored.footer?.copyright_text ?? DEFAULT_APP_CONFIG.footer.copyright_text,
      },
    };
  }

  async updateAppConfig(payload: Partial<AppConfigData>, updatedBy?: string): Promise<AppConfigData> {
    if (!payload || typeof payload !== 'object') {
      throw new AppError('Invalid configuration payload', 400);
    }

    const current = await this.getAppConfig();
    const parsedTax =
      payload.tax_percent !== undefined ? Number(payload.tax_percent) : current.tax_percent;
    if (Number.isNaN(parsedTax) || parsedTax < 0 || parsedTax > 100) {
      throw new AppError('Tax percentage must be a number between 0 and 100', 400);
    }

    const parsedPlatformFee =
      payload.platform_fee_percent !== undefined
        ? Number(payload.platform_fee_percent)
        : (current.platform_fee_percent ?? 5);
    if (Number.isNaN(parsedPlatformFee) || parsedPlatformFee < 0 || parsedPlatformFee > 100) {
      throw new AppError('Platform fee percentage must be a number between 0 and 100', 400);
    }

    const merged: AppConfigData = {
      tax_percent: parsedTax,
      platform_fee_percent: parsedPlatformFee,
      credentials: {
        subtitle: payload.credentials?.subtitle ?? current.credentials.subtitle,
        title: payload.credentials?.title ?? current.credentials.title,
        items: Array.isArray(payload.credentials?.items)
          ? payload.credentials.items
          : current.credentials.items,
      },
      contact: {
        title: payload.contact?.title ?? current.contact.title,
        description: payload.contact?.description ?? current.contact.description,
        address: payload.contact?.address ?? current.contact.address,
        phone: payload.contact?.phone ?? current.contact.phone,
        email: payload.contact?.email ?? current.contact.email,
        business_hours: {
          weekday: payload.contact?.business_hours?.weekday ?? current.contact.business_hours.weekday,
          saturday:
            payload.contact?.business_hours?.saturday ?? current.contact.business_hours.saturday,
          sunday: payload.contact?.business_hours?.sunday ?? current.contact.business_hours.sunday,
        },
      },
      about: {
        badge: payload.about?.badge ?? current.about.badge,
        title: payload.about?.title ?? current.about.title,
        description_1: payload.about?.description_1 ?? current.about.description_1,
        description_2: payload.about?.description_2 ?? current.about.description_2,
        image: payload.about?.image ?? current.about.image,
        vision_title: payload.about?.vision_title ?? current.about.vision_title,
        vision_desc: payload.about?.vision_desc ?? current.about.vision_desc,
        mission_title: payload.about?.mission_title ?? current.about.mission_title,
        mission_desc: payload.about?.mission_desc ?? current.about.mission_desc,
        values_badge: payload.about?.values_badge ?? current.about.values_badge,
        values_title: payload.about?.values_title ?? current.about.values_title,
        values: Array.isArray(payload.about?.values) ? payload.about.values : current.about.values,
        team_badge: payload.about?.team_badge ?? current.about.team_badge,
        team_title: payload.about?.team_title ?? current.about.team_title,
        team_members: Array.isArray(payload.about?.team_members)
          ? payload.about.team_members
          : current.about.team_members,
      },
      footer: {
        brand_description: payload.footer?.brand_description ?? current.footer.brand_description,
        address: payload.footer?.address ?? current.footer.address,
        phone: payload.footer?.phone ?? current.footer.phone,
        email: payload.footer?.email ?? current.footer.email,
        quick_links: Array.isArray(payload.footer?.quick_links)
          ? payload.footer.quick_links
          : current.footer.quick_links,
        support_links: Array.isArray(payload.footer?.support_links)
          ? payload.footer.support_links
          : current.footer.support_links,
        copyright_text: payload.footer?.copyright_text ?? current.footer.copyright_text,
      },
    };

    const { rows } = await pool.query(
      `INSERT INTO content.app_config (id, config, updated_by, updated_at)
       VALUES (1, $1::jsonb, $2, NOW())
       ON CONFLICT (id)
       DO UPDATE SET config = EXCLUDED.config, updated_by = EXCLUDED.updated_by, updated_at = NOW()
       RETURNING config;`,
      [JSON.stringify(merged), updatedBy || null]
    );

    return rows[0].config as AppConfigData;
  }
}

export const appConfigService = new AppConfigService();
