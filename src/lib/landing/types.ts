/** Landing page section types — all variants live here. */

export type SectionType =
  | 'hero'
  | 'about'
  | 'services'
  | 'gallery'
  | 'reviews'
  | 'contact'
  | 'faq'
  | 'cta';

export interface BaseSection {
  id: string;
  type: SectionType;
  order: number;
}

export interface HeroSection extends BaseSection {
  type: 'hero';
  data: {
    headline: string;
    subheadline?: string;
    cta_label?: string;
    cta_link?: string;
    image_url?: string;
  };
}

export interface AboutSection extends BaseSection {
  type: 'about';
  data: {
    title: string;
    body: string;
    image_url?: string;
  };
}

export interface ServicesSection extends BaseSection {
  type: 'services';
  data: {
    title: string;
    items: Array<{ name: string; description?: string; price_label?: string }>;
  };
}

export interface GallerySection extends BaseSection {
  type: 'gallery';
  data: {
    title: string;
    images: Array<{ url: string; caption?: string }>;
  };
}

export interface ReviewsSection extends BaseSection {
  type: 'reviews';
  data: {
    title: string;
    items: Array<{ author: string; rating?: number; text: string }>;
  };
}

export interface ContactSection extends BaseSection {
  type: 'contact';
  data: {
    phone?: string;
    email?: string;
    address?: string;
    map_url?: string;
    hours?: string;
  };
}

export interface FaqSection extends BaseSection {
  type: 'faq';
  data: {
    items: Array<{ question: string; answer: string }>;
  };
}

export interface CtaSection extends BaseSection {
  type: 'cta';
  data: {
    headline: string;
    button_label: string;
    button_link: string;
  };
}

export type Section =
  | HeroSection
  | AboutSection
  | ServicesSection
  | GallerySection
  | ReviewsSection
  | ContactSection
  | FaqSection
  | CtaSection;

export interface LandingPage {
  id: string;
  tenant_id: string;
  is_published: boolean;
  primary_color: string;
  hero_image_url: string | null;
  logo_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  sections: Section[];
  show_booking_widget: boolean;
}

export const SECTION_DEFAULTS: Record<SectionType, () => Section['data']> = {
  hero: () => ({
    headline: 'อู่ซ่อมรถมืออาชีพ',
    subheadline: 'บริการครบวงจร — ดูแลรถคุณเหมือนรถเรา',
    cta_label: 'จองคิวซ่อม',
    cta_link: '#booking',
  }),
  about: () => ({
    title: 'เกี่ยวกับเรา',
    body: 'อู่ซ่อมรถที่ให้บริการมากว่า 20 ปี ด้วยทีมช่างมืออาชีพและอะไหล่คุณภาพ',
  }),
  services: () => ({
    title: 'บริการของเรา',
    items: [
      { name: 'ตรวจเช็คระยะ', description: 'ตามกำหนดของรถยนต์', price_label: 'เริ่มต้น 590฿' },
      { name: 'เปลี่ยนถ่ายน้ำมันเครื่อง', description: 'น้ำมันเครื่องเกรดพรีเมียม', price_label: 'เริ่มต้น 990฿' },
      { name: 'ซ่อมเบรค', description: 'ผ้าเบรค จานเบรค', price_label: 'ตามรุ่น' },
    ],
  }),
  gallery: () => ({ title: 'ผลงาน', images: [] }),
  reviews: () => ({ title: 'รีวิวจากลูกค้า', items: [] }),
  contact: () => ({
    phone: '',
    email: '',
    address: '',
  }),
  faq: () => ({ items: [{ question: 'รับงานเคลมประกันไหม?', answer: 'รับครับ ทุกบริษัท' }] }),
  cta: () => ({
    headline: 'พร้อมดูแลรถของคุณ',
    button_label: 'จองคิวเลย',
    button_link: '#booking',
  }),
};

export const SECTION_LABELS: Record<SectionType, string> = {
  hero: 'Hero — แบนเนอร์หลัก',
  about: 'เกี่ยวกับเรา',
  services: 'บริการ',
  gallery: 'แกลเลอรี',
  reviews: 'รีวิวลูกค้า',
  contact: 'ติดต่อเรา',
  faq: 'คำถามที่พบบ่อย',
  cta: 'Call to Action',
};
