import { ValidationResult } from '../types';

export const validateNvidiaApiKey = async (apiKey: string): Promise<ValidationResult> => {
  const cleanKey = apiKey.trim();

  if (!cleanKey) {
    return {
      isValid: false,
      errorType: 'invalid_key',
      message: 'مفتاح الـ API لا يمكن أن يكون فارغاً.'
    };
  }

  // Basic shape check: NVIDIA NIM keys start with "nvapi-" and are long enough
  if (!cleanKey.startsWith('nvapi-') || cleanKey.length < 20) {
    return {
      isValid: false,
      errorType: 'invalid_key',
      message: 'صيغة المفتاح غير صحيحة. مفاتيح Nvidia NIM يجب أن تبدأ بـ "nvapi-".'
    };
  }

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cleanKey}`,
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(7000)
    });

    if (response.ok) {
      return {
        isValid: true,
        message: 'تم التحقق بنجاح! مفتاح Nvidia NIM صالح للاستخدام وتم تحديث قائمة النماذج.'
      };
    } else if (response.status === 401 || response.status === 403) {
      return {
        isValid: false,
        errorType: 'invalid_key',
        message: 'مفتاح الـ API غير صحيح أو انتهت صلاحيته. يرجى التحقق من الحساب.'
      };
    } else {
      return {
        isValid: false,
        errorType: 'unknown',
        message: `خطأ في الخادم (رمز الاستجابة: ${response.status})`
      };
    }
  } catch (error: any) {
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return {
        isValid: false,
        errorType: 'network_error',
        message: 'انتهت مهلة الاتصال بالخادم. يرجى التحقق من شبكة الإنترنت.'
      };
    }
    return {
      isValid: false,
      errorType: 'network_error',
      message: 'فشل الاتصال بخادم Nvidia (قد تكون هناك قيود CORS في المتصفح). حاول مرة أخرى أو أدخل المفتاح يدوياً في الإعدادات.'
    };
  }
};
