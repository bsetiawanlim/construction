import _ from "lodash";

export function extractFieldForUpdate<T extends { id: number, updatedAt?: Date | null, updatedBy?: string | null }>(oldModel: T, updateBody: Record<string, any>): any {
    const payload: Partial<T> = {};
    for (const key in oldModel) {
        if (key === "id" || key === "updatedAt" || key === "updatedBy" || key === "createdBy" || key === "createdAt" || key === "deletedAt") {
            continue;
        } else if (updateBody[key] !== undefined && updateBody[key] !== oldModel[key]) {
            payload[key] = updateBody[key];
        }
    }

    if (Object.keys(payload).length === 0) {
        return null;
    } else {
        payload["id"] = oldModel["id"];
        return payload;
    }


}


export function isDataTheSame<T extends { id: number, updatedAt?: Date | null, updatedBy?: string | null }>(oldModel: T, updateBody: Partial<T>): boolean {
    return _.isEqual(oldModel, updateBody);
}


export function sanitizeFilters(filters: Record<string, any>) {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(filters)) {
        if (value !== null) {
            sanitized[key] = value;
        }
    }
    return sanitized;
}