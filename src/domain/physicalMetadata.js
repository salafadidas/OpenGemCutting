export function validatePhysicalMetadata(metadata) {
  if (metadata?.sizeWeight !== undefined) {
    const value = metadata.sizeWeight;
    if (!value || !Number.isFinite(value.sg) || value.sg <= 0 || typeof value.material !== 'string' || !value.material.trim() || value.material.length > 200) throw new Error('尺寸材质必须包含名称与正数比重。');
  }
}
