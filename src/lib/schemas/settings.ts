import { z } from 'zod';

export const codAdvanceSettingsSchema = z.object({
  shipping_mode: z.enum(['delhivery_pending', 'auto_manifest']).optional(),
  cod_advance_enabled: z.enum(['true', 'false']).optional(),
  cod_advance_type: z.enum(['FIXED', 'PERCENTAGE']).optional(),
  cod_advance_value: z
    .string()
    .optional()
    .refine((val) => {
      if (val === undefined || val === '') return true;
      const num = Number(val);
      return !isNaN(num) && num >= 1;
    }, { message: 'Advance value must be at least ₹1 or 1%' }),
  cod_advance_max_cap: z
    .string()
    .optional()
    .nullable()
    .refine((val) => {
      if (!val || val === '') return true;
      const num = Number(val);
      return !isNaN(num) && num > 0;
    }, { message: 'Maximum cap must be a positive number greater than 0' }),
  cod_advance_message: z
    .string()
    .max(300, { message: 'Customer message cannot exceed 300 characters' })
    .optional(),
}).superRefine((data, ctx) => {
  if (data.cod_advance_type === 'PERCENTAGE' && data.cod_advance_value) {
    const val = Number(data.cod_advance_value);
    if (val < 1 || val > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cod_advance_value'],
        message: 'Advance percentage must be between 1% and 100%',
      });
    }
  }
  if (data.cod_advance_type === 'FIXED' && data.cod_advance_value) {
    const val = Number(data.cod_advance_value);
    if (val < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cod_advance_value'],
        message: 'Fixed advance amount must be at least ₹1 (gateway minimum)',
      });
    }
    if (!Number.isInteger(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cod_advance_value'],
        message: 'Fixed advance amount must be in whole rupees',
      });
    }
  }
});

export type CodAdvanceSettingsValues = z.infer<typeof codAdvanceSettingsSchema>;
export const settingsSchema = codAdvanceSettingsSchema;
