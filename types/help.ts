export interface HelpCategory {
  id: string;
  title: string;
  icon: string;
  items: HelpItem[];
  priority?: 'high' | 'medium' | 'low';
}

export interface HelpItem {
  id: string;
  title: string;
  content: string;
  type: 'faq' | 'guide' | 'contact' | 'crisis';
}