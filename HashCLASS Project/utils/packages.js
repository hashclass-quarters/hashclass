async function getAllPackages() {
  const result = await trickleListObjects('lesson_package', 1000, true);
  return result.items
    .map(item => ({
      id: item.objectData.packageId,
      objectId: item.objectId,
      name: item.objectData.name,
      description: item.objectData.description,
      maxOrders: item.objectData.maxOrders,
      price: item.objectData.price,
      orders: item.objectData.orders || 0
    }))
    .sort((a, b) => a.id - b.id);
}

async function reservePackage(packageId) {
  try {
    if (!packageId) return false;
    
    const result = await trickleListObjects('lesson_package', 1, true, undefined, { filter: { packageId: String(packageId) } });
    const pkg = result && result.items && result.items[0];
    if (pkg && pkg.objectData.orders < pkg.objectData.maxOrders) {
      await trickleUpdateObject('lesson_package', pkg.objectId, {
        orders: (pkg.objectData.orders || 0) + 1
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Reserve package error:', error);
    return false;
  }
}

async function releasePackage(packageId) {
  const result = await trickleListObjects('lesson_package', 1, true, undefined, { filter: { packageId: String(packageId) } });
  const pkg = result.items[0];
  if (pkg && pkg.objectData.orders > 0) {
    await trickleUpdateObject('lesson_package', pkg.objectId, {
      orders: pkg.objectData.orders - 1
    });
  }
}

async function deletePackage(objectId) {
  await trickleDeleteObject('lesson_package', objectId);
  
  const registeredUsers = await getAllRegisteredUsers();
  for (const user of registeredUsers) {
    if (user.lessonPackage) {
      const pkgData = typeof user.lessonPackage === 'string' ? JSON.parse(user.lessonPackage) : user.lessonPackage;
      if (pkgData && pkgData.objectId === objectId) {
        await trickleUpdateObject('registered_user', user.objectId, { lessonPackage: null });
      }
    }
  }
}

async function updatePackageAvailability(objectId, newMaxOrders) {
  const pkg = await trickleGetObject('lesson_package', objectId);
  if (pkg) {
    await trickleUpdateObject('lesson_package', objectId, {
      ...pkg.objectData,
      maxOrders: newMaxOrders
    });
  }
}

async function updatePackageOrders(objectId, newOrders, newMaxOrders) {
  const pkg = await trickleGetObject('lesson_package', objectId);
  if (pkg) {
    await trickleUpdateObject('lesson_package', objectId, {
      ...pkg.objectData,
      orders: newOrders,
      maxOrders: newMaxOrders
    });
  }
}
