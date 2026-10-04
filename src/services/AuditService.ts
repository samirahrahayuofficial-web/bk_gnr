import { db } from '../db/storage';
import { AuditLog, UserRole } from '../types/database';

export class AuditService {
  public static log(
    userId: string,
    userName: string,
    userRole: UserRole,
    action: string,
    entity: string,
    details: string,
    entityId?: string
  ): void {
    db.addAuditLog({
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      action,
      entity,
      entity_id: entityId,
      details,
    });
  }

  public static getLogs(): AuditLog[] {
    return db.getAuditLogs();
  }
}
