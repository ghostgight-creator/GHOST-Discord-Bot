import { SupportedLanguage } from '../types';

export const translations = {
  ar: {
    common: {
      success: 'تم بنجاح',
      error: 'حدث خطأ',
      permissionDenied: 'ليس لديك الصلاحيات الكافية لتنفيذ هذا الإجراء.',
      botMissingPermissions: 'البوت لا يملك الصلاحيات الكافية في هذا السيرفر/الروم.',
      userNotFound: 'لم يتم العثور على العضو المطلوب.',
      actionLogged: 'تم تسجيل الإجراء في روم السجلات.',
      notAvailable: 'غير متاح',
      unknown: 'غير معروف',
      cancel: 'إلغاء'
    },
    setup: {
      title: '⚙️ لوحة تحكم إعدادات بوت GHOST',
      description: 'مرحباً بك في لوحة الإعدادات الشاملة. يمكنك تخصيص إعدادات السيرفر عبر القوائم والأزرار أدناه بدون الحاجة لتعديل الكود:',
      currentLanguage: 'اللغة الحالية: **العربية 🇸🇦**',
      welcomeChannel: 'روم الترحيب',
      logChannel: 'روم السجلات (Logs)',
      ticketCategory: 'قسم التذاكر (Category)',
      supportRole: 'رتبة الدعم الفني',
      adminRole: 'رتبة الشكاوى الإدارية',
      autoRole: 'الرتبة التلقائية للجدد',
      adminOnlyToggle: 'حصر الأوامر العامة للإدارة فقط',
      embedColor: 'لون الرسائل (Hex)',
      notSet: 'غير محدد ❌',
      updated: '✅ تم تحديث الإعدادات بنجاح!'
    },
    welcome: {
      previewTitle: '👁️ معاينة بطاقة الترحيب الافتراضية',
      rulesButton: '📜 القوانين',
      joinMessage: 'أنت العضو رقم'
    },
    tickets: {
      panelTitle: '🎫 مركز الدعم الفني والتذاكر | Support Center',
      panelDesc: 'اختر نوع التذكرة المناسب من القائمة بالأسفل لمساعدتك وفتح محادثة خاصة مع الإدارة وفريق الدعم المختص:',
      selectPlaceholder: 'اختر نوع التذكرة لفتحها...',
      typeSupport: '🛠️ دعم فني (Technical Support)',
      typeReport: '🚨 بلاغ على عضو (Report Member)',
      typeAdmin: '⚖️ شكوى إدارية (Admin Complaint)',
      typeInquiry: '❓ استفسار عام (General Inquiry)',
      modalTitle: 'فتح تذكرة جديدة',
      modalReasonLabel: 'سبب فتح التذكرة بالتفصيل',
      modalReasonPlaceholder: 'اكتب سبب التذكرة والمشكلة هنا بالتفصيل...',
      alreadyOpen: '⚠️ لديك تذكرة مفتوحة بالفعل من هذا النوع! يمكنك التوجه إليها مباشرة:',
      createdSuccess: '✅ تم إنشاء تذكرتك بنجاح:',
      welcomeInTicket: 'مرحباً بك {user}! 👋\nتم فتح تذكرتك وسيقوم فريق الدعم بالرد عليك في أقرب وقت.\nيرجى توضيح استفسارك بالتفصيل.',
      btnClaim: '✋ استلام التذكرة',
      btnAddMember: '➕ إضافة عضو',
      btnClose: '🔒 إغلاق التذكرة',
      claimedBy: 'تم استلام التذكرة بواسطة:',
      closeModalTitle: 'إغلاق التذكرة',
      closeReasonLabel: 'سبب إغلاق التذكرة',
      closeTranscriptSaved: 'تم حفظ نسخة المحادثة (Transcript) في روم السجلات بنجاح وسيتم حذف الروم خلال 5 ثوانٍ.'
    },
    roblox: {
      userNotFound: '❌ لم يتم العثور على مستخدم روبلوكس بهذا الاسم أو المعرف.',
      apiUnavailable: '⚠️ خدمة Roblox لم تستجب حالياً أو هناك ضغط على الطلبات، يرجى المحاولة لاحقاً.',
      privateInfo: 'خاص / غير متاح',
      accountAge: 'عمر الحساب',
      createdDate: 'تاريخ الإنشاء',
      friendsCount: 'الأصدقاء',
      followersCount: 'المتابعون',
      followingCount: 'يتابع',
      btnProfile: '🌐 فتح البروفايل',
      btnAvatarFull: '🧍 عرض الأفتار كاملًا',
      btnGroups: '👥 المجموعات',
      btnAvatarHead: '👤 صورة الرأس (Headshot)',
      groupsTitle: 'مجموعات اللاعب العامة:',
      noGroups: 'اللاعب ليس عضواً في أي مجموعة عامة.',
      gameNotFound: '❌ لم يتم العثور على التجربة أو المكان المطلوب في روبلوكس.',
      groupNotFound: '❌ لم يتم العثور على المجموعة المطلوبة في روبلوكس.'
    }
  },
  en: {
    common: {
      success: 'Success',
      error: 'An error occurred',
      permissionDenied: 'You do not have enough permissions to perform this action.',
      botMissingPermissions: 'The bot lacks required permissions in this server/channel.',
      userNotFound: 'The requested member was not found.',
      actionLogged: 'Action logged to logs channel.',
      notAvailable: 'Not Available',
      unknown: 'Unknown',
      cancel: 'Cancel'
    },
    setup: {
      title: '⚙️ GHOST Bot Configuration Panel',
      description: 'Welcome to the comprehensive settings dashboard. Customize server settings via menus and buttons below without editing code:',
      currentLanguage: 'Current Language: **English 🇺🇸**',
      welcomeChannel: 'Welcome Channel',
      logChannel: 'Logs Channel',
      ticketCategory: 'Ticket Category',
      supportRole: 'Support Staff Role',
      adminRole: 'Admin Complaints Role',
      autoRole: 'New Member Auto-Role',
      adminOnlyToggle: 'Admin-Only General Commands',
      embedColor: 'Embed Color (Hex)',
      notSet: 'Not Set ❌',
      updated: '✅ Settings updated successfully!'
    },
    welcome: {
      previewTitle: '👁️ Default Welcome Card Preview',
      rulesButton: '📜 Rules',
      joinMessage: 'You are member'
    },
    tickets: {
      panelTitle: '🎫 Support & Help Desk Center',
      panelDesc: 'Select the appropriate ticket type from the menu below to open a private channel with our staff:',
      selectPlaceholder: 'Select ticket category to open...',
      typeSupport: '🛠️ Technical Support',
      typeReport: '🚨 Report a Member',
      typeAdmin: '⚖️ Admin Complaint',
      typeInquiry: '❓ General Inquiry',
      modalTitle: 'Open New Ticket',
      modalReasonLabel: 'Detailed Reason for Ticket',
      modalReasonPlaceholder: 'Write the details and purpose of your ticket here...',
      alreadyOpen: '⚠️ You already have an open ticket of this type! Access it here:',
      createdSuccess: '✅ Your ticket has been created successfully:',
      welcomeInTicket: 'Welcome {user}! 👋\nYour ticket has been opened. Our support staff will be with you shortly.\nPlease provide all details while waiting.',
      btnClaim: '✋ Claim Ticket',
      btnAddMember: '➕ Add Member',
      btnClose: '🔒 Close Ticket',
      claimedBy: 'Ticket claimed by:',
      closeModalTitle: 'Close Ticket',
      closeReasonLabel: 'Reason for closing ticket',
      closeTranscriptSaved: 'Conversation transcript saved to log channel. Channel will be deleted in 5 seconds.'
    },
    roblox: {
      userNotFound: '❌ Roblox user not found with this username or ID.',
      apiUnavailable: '⚠️ Roblox API is currently unavailable or rate limited. Please try again later.',
      privateInfo: 'Private / N/A',
      accountAge: 'Account Age',
      createdDate: 'Created Date',
      friendsCount: 'Friends',
      followersCount: 'Followers',
      followingCount: 'Following',
      btnProfile: '🌐 Open Profile',
      btnAvatarFull: '🧍 Full Body Avatar',
      btnGroups: '👥 Groups',
      btnAvatarHead: '👤 Headshot',
      groupsTitle: 'Player Public Groups:',
      noGroups: 'User is not part of any public groups.',
      gameNotFound: '❌ Game or Place not found on Roblox.',
      groupNotFound: '❌ Group not found on Roblox.'
    }
  }
};

export function getLang(lang: SupportedLanguage = 'ar') {
  return translations[lang] || translations.ar;
}
