import { prisma } from './db/prisma';
import admin, { db as firestore } from './firebase-admin';

export type LogPriority = 'low' | 'medium' | 'high' | 'critical';

export interface AuditLogData {
  userId: string;
  action: string;
  resource: string;
  payload?: any;
  priority?: LogPriority;
}

/**
 * Unified Audit Logger - Responde a la Ley 1620 y ISO 21001.
 * Registra de forma redundante en MySQL y Firestore.
 * Firebase (Firestore) actúa como la fuente primaria de datos operativos.
 */
export async function logAction(data: AuditLogData) {
  const { userId, action, resource, payload, priority = 'low' } = data;
  const timestamp = new Date();

  console.log(`[AuditLog] LOGGING START: ${action} | Resource: ${resource}`);

  try {
    // 1. Registro en Firebase Firestore (Fuente Primaria)
    const firestoreLog = await firestore.collection('audit_logs').add({
      userId,
      action,
      resource,
      payload: payload || {},
      priority,
      timestamp: admin.firestore.Timestamp.fromDate(timestamp),
      system: 'Antigravity SGC',
    });
    console.log(`[AuditLog] Firestore Log ID: ${firestoreLog.id}`);

    // 2. Registro en MySQL (Secundario/Trazabilidad)
    const sqlLog = await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        payload: payload || {},
        priority,
        timestamp,
      },
    });
    console.log(`[AuditLog] MySQL Log ID: ${sqlLog.id}`);

    return { success: true, firestoreId: firestoreLog.id, sqlId: sqlLog.id };
  } catch (error) {
    console.error('[AuditLog] CRITICAL ERROR:', error);
    return { success: false, error };
  }
}
