import { getPermission } from "../modules/personal/permission/permissionController";
import { prisma } from "../plugins/prisma";

export default async function validatePermission(request: any, response: any) {
    const userId = request.session?.user?.id || request.session?.session?.userId || request.session?.userId;
    if (!userId) {
        return response.code(401).send({ error: "Unauthorized!" });
    }
    const user = await prisma.user.findFirst({
        where: {
            id: userId
        }
    });
    if (!user) {
        return response.code(401).send({ error: "Unauthorized!" });
    } else {

        if (user.isSuperAdmin) {
            return true;
        } else if (!user.roleId) {
            return response.code(403).send({ error: "Permission denied, no roleId" });
        } else {

            const cleanUrl = request.url.split('?')[0];
            const parts = cleanUrl.split('/').filter((item: string) => item !== "" && item !== 'api');
            const tableName = parts[0] === 'pos' && parts.length > 2 ? parts[1] : parts[0];
            const actionName = parts[0] === 'pos' && parts.length > 2 ? parts[2] : parts[1];
            let permission = await getPermission(user.roleId, tableName, actionName);
            if (!permission) {
                permission = await getPermission(user.roleId, tableName, '*');
            }
            if (!permission && tableName.startsWith('facility-')) {
                permission = (await getPermission(user.roleId, 'facility', actionName)) || (await getPermission(user.roleId, 'facility', '*'));
            }
            if (!permission) {
                return response.code(403).send({ error: "Permission denied." });
            }

        }

    }
};


