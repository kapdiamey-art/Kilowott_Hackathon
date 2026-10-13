/**
 * LanguageContext — multi-language support.
 * Supports English (en), Hindi (hi), Marathi (mr).
 */
import { createContext, useContext, useState, type ReactNode } from 'react';

export type Lang = 'en' | 'hi' | 'mr';

// ─── Translation map ─────────────────────────────────────────────────────────

const translations: Record<Lang, Record<string, string>> = {
  en: {
    nav_dashboard: 'Dashboard', nav_products: 'Products', nav_ai_assistant: 'AI Assistant',
    nav_quality: 'Data Quality', nav_duplicates: 'Duplicates', nav_categories: 'Categories',
    nav_publishing: 'Publishing', nav_activity: 'Activity', nav_settings: 'Settings',
    search_placeholder: 'Search products…', btn_add_product: 'Add Product', sign_out: 'Sign out',
    dashboard_title: 'Overview', total_products: 'Total Products', published: 'Published',
    needs_attention: 'Need Attention', avg_completeness: 'Avg. Completeness',
    recent_products: 'Recent Products', view_all: 'View all', recent_activity: 'Recent Activity',
    products_title: 'Products', search_by_name: 'Search by name or SKU…',
    all_categories: 'All Categories', all_statuses: 'All Statuses', add_product: 'Add Product',
    product: 'Product', category: 'Category', brand: 'Brand', price: 'Price',
    complete: 'Complete', status: 'Status', updated: 'Updated',
    status_draft: 'Draft', status_in_review: 'In Review', status_ready: 'Ready', status_published: 'Published',
    new_product: 'New Product', save: 'Save', saving: 'Saving…', cancel: 'Cancel',
    basic_info: 'Basic Information', product_name: 'Product Name', sku: 'SKU',
    descriptions: 'Descriptions & Content', pricing: 'Pricing', attributes: 'Attributes', seo: 'SEO Metadata',
    ai_improve: 'AI Improve', ai_generate: 'AI Generate',
    quality_title: 'Data Quality', quality_score: 'Quality Score', recalculate: 'Recalculate All', fix: 'Fix',
    duplicates_title: 'Duplicate Finder', scan: 'Scan for Duplicates',
    dismiss: 'Dismiss', confirm_duplicate: 'Confirm Duplicate',
    categories_title: 'Categories & Attributes', add_category: 'Add Category', add_attribute: 'Add Attribute',
    publishing_title: 'Publishing Center', ready_to_publish: 'Ready to Publish',
    publish: 'Publish', publishing: 'Publishing…',
    activity_title: 'Activity Log',
    settings_title: 'Settings', workspace: 'Workspace', workspace_name: 'Workspace Name',
    save_settings: 'Save Settings', configure: 'Configure', not_connected: 'Not Connected', connected: 'Connected',
    ai_title: 'AI Product Assistant', generate: 'Generate Suggestion', generating: 'Generating…',
    apply: 'Apply to Product', reject: 'Reject', regenerate: 'Regenerate', start_over: 'Start over',
    welcome_back: 'Welcome back', sign_in: 'Sign In', signing_in: 'Signing in…',
    loading: 'Loading…', create: 'Create', delete: 'Delete', edit: 'Edit', refresh: 'Refresh',
    export_csv: 'Export CSV', export_json: 'Export JSON',
  },
  hi: {
    nav_dashboard: 'डैशबोर्ड', nav_products: 'उत्पाद', nav_ai_assistant: 'AI सहायक',
    nav_quality: 'डेटा गुणवत्ता', nav_duplicates: 'डुप्लीकेट', nav_categories: 'श्रेणियाँ',
    nav_publishing: 'प्रकाशन', nav_activity: 'गतिविधि', nav_settings: 'सेटिंग्स',
    search_placeholder: 'उत्पाद खोजें…', btn_add_product: 'उत्पाद जोड़ें', sign_out: 'लॉग आउट',
    dashboard_title: 'अवलोकन', total_products: 'कुल उत्पाद', published: 'प्रकाशित',
    needs_attention: 'ध्यान चाहिए', avg_completeness: 'औसत पूर्णता',
    recent_products: 'हाल के उत्पाद', view_all: 'सभी देखें', recent_activity: 'हाल की गतिविधि',
    products_title: 'उत्पाद', search_by_name: 'नाम या SKU से खोजें…',
    all_categories: 'सभी श्रेणियाँ', all_statuses: 'सभी स्थितियाँ', add_product: 'उत्पाद जोड़ें',
    product: 'उत्पाद', category: 'श्रेणी', brand: 'ब्रांड', price: 'कीमत',
    complete: 'पूर्णता', status: 'स्थिति', updated: 'अपडेट',
    status_draft: 'मसौदा', status_in_review: 'समीक्षाधीन', status_ready: 'तैयार', status_published: 'प्रकाशित',
    new_product: 'नया उत्पाद', save: 'सहेजें', saving: 'सहेजा जा रहा है…', cancel: 'रद्द करें',
    basic_info: 'मूलभूत जानकारी', product_name: 'उत्पाद का नाम', sku: 'SKU',
    descriptions: 'विवरण और सामग्री', pricing: 'मूल्य निर्धारण', attributes: 'विशेषताएँ', seo: 'SEO मेटाडेटा',
    ai_improve: 'AI सुधार', ai_generate: 'AI उत्पन्न करें',
    quality_title: 'डेटा गुणवत्ता', quality_score: 'गुणवत्ता स्कोर', recalculate: 'पुनः गणना करें', fix: 'सुधारें',
    duplicates_title: 'डुप्लीकेट खोजक', scan: 'डुप्लीकेट स्कैन करें',
    dismiss: 'अनदेखा करें', confirm_duplicate: 'डुप्लीकेट पुष्टि करें',
    categories_title: 'श्रेणियाँ और विशेषताएँ', add_category: 'श्रेणी जोड़ें', add_attribute: 'विशेषता जोड़ें',
    publishing_title: 'प्रकाशन केंद्र', ready_to_publish: 'प्रकाशन के लिए तैयार',
    publish: 'प्रकाशित करें', publishing: 'प्रकाशित हो रहा है…',
    activity_title: 'गतिविधि लॉग',
    settings_title: 'सेटिंग्स', workspace: 'कार्यक्षेत्र', workspace_name: 'कार्यक्षेत्र का नाम',
    save_settings: 'सेटिंग्स सहेजें', configure: 'कॉन्फ़िगर करें', not_connected: 'कनेक्ट नहीं', connected: 'कनेक्टेड',
    ai_title: 'AI उत्पाद सहायक', generate: 'सुझाव उत्पन्न करें', generating: 'उत्पन्न हो रहा है…',
    apply: 'उत्पाद पर लागू करें', reject: 'अस्वीकार करें', regenerate: 'पुनः उत्पन्न करें', start_over: 'फिर से शुरू करें',
    welcome_back: 'वापस स्वागत है', sign_in: 'साइन इन करें', signing_in: 'साइन इन हो रहा है…',
    loading: 'लोड हो रहा है…', create: 'बनाएँ', delete: 'हटाएँ', edit: 'संपादित करें', refresh: 'ताज़ा करें',
    export_csv: 'CSV निर्यात', export_json: 'JSON निर्यात',
  },
  mr: {
    nav_dashboard: 'डॅशबोर्ड', nav_products: 'उत्पादने', nav_ai_assistant: 'AI सहाय्यक',
    nav_quality: 'डेटा गुणवत्ता', nav_duplicates: 'डुप्लिकेट', nav_categories: 'श्रेणी',
    nav_publishing: 'प्रकाशन', nav_activity: 'क्रियाकलाप', nav_settings: 'सेटिंग्ज',
    search_placeholder: 'उत्पादे शोधा…', btn_add_product: 'उत्पाद जोडा', sign_out: 'बाहेर पडा',
    dashboard_title: 'आढावा', total_products: 'एकूण उत्पादने', published: 'प्रकाशित',
    needs_attention: 'लक्ष द्या', avg_completeness: 'सरासरी पूर्णता',
    recent_products: 'अलीकडील उत्पादने', view_all: 'सर्व पहा', recent_activity: 'अलीकडील क्रियाकलाप',
    products_title: 'उत्पादने', search_by_name: 'नाव किंवा SKU ने शोधा…',
    all_categories: 'सर्व श्रेणी', all_statuses: 'सर्व स्थिती', add_product: 'उत्पाद जोडा',
    product: 'उत्पाद', category: 'श्रेणी', brand: 'ब्रँड', price: 'किंमत',
    complete: 'पूर्णता', status: 'स्थिती', updated: 'अद्यतनित',
    status_draft: 'मसुदा', status_in_review: 'पुनरावलोकनाधीन', status_ready: 'तयार', status_published: 'प्रकाशित',
    new_product: 'नवीन उत्पाद', save: 'जतन करा', saving: 'जतन होत आहे…', cancel: 'रद्द करा',
    basic_info: 'मूलभूत माहिती', product_name: 'उत्पादाचे नाव', sku: 'SKU',
    descriptions: 'वर्णन आणि सामग्री', pricing: 'मूल्य निर्धारण', attributes: 'गुणधर्म', seo: 'SEO मेटाडेटा',
    ai_improve: 'AI सुधारणा', ai_generate: 'AI निर्माण करा',
    quality_title: 'डेटा गुणवत्ता', quality_score: 'गुणवत्ता गुण', recalculate: 'पुन्हा मोजा', fix: 'दुरुस्त करा',
    duplicates_title: 'डुप्लिकेट शोधक', scan: 'डुप्लिकेट स्कॅन करा',
    dismiss: 'नाकारा', confirm_duplicate: 'डुप्लिकेट पुष्टी करा',
    categories_title: 'श्रेणी आणि गुणधर्म', add_category: 'श्रेणी जोडा', add_attribute: 'गुणधर्म जोडा',
    publishing_title: 'प्रकाशन केंद्र', ready_to_publish: 'प्रकाशनासाठी तयार',
    publish: 'प्रकाशित करा', publishing: 'प्रकाशित होत आहे…',
    activity_title: 'क्रियाकलाप नोंदी',
    settings_title: 'सेटिंग्ज', workspace: 'कार्यक्षेत्र', workspace_name: 'कार्यक्षेत्राचे नाव',
    save_settings: 'सेटिंग्ज जतन करा', configure: 'कॉन्फिगर करा', not_connected: 'जोडलेले नाही', connected: 'जोडलेले',
    ai_title: 'AI उत्पाद सहाय्यक', generate: 'सूचना तयार करा', generating: 'तयार होत आहे…',
    apply: 'उत्पादावर लागू करा', reject: 'नाकारा', regenerate: 'पुन्हा तयार करा', start_over: 'पुन्हा सुरू करा',
    welcome_back: 'पुन्हा स्वागत आहे', sign_in: 'साइन इन करा', signing_in: 'साइन इन होत आहे…',
    loading: 'लोड होत आहे…', create: 'तयार करा', delete: 'हटवा', edit: 'संपादित करा', refresh: 'ताजे करा',
    export_csv: 'CSV निर्यात', export_json: 'JSON निर्यात',
  },
};

// ─── Context ─────────────────────────────────────────────────────────────────

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, fallback?: string) => string;
}

const LangContext = createContext<LangContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem('ps_lang') as Lang | null) ?? 'en';
  });

  const setLang = (l: Lang) => {
    localStorage.setItem('ps_lang', l);
    setLangState(l);
  };

  const t = (key: string, fallback?: string): string =>
    translations[lang][key] ?? translations.en[key] ?? fallback ?? key;

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
