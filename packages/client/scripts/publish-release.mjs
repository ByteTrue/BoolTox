import { publishRelease } from './release-manager.mjs';

const main = async () => {
  const skipBuild = process.env.SKIP_BUILD === '1' || process.env.SKIP_BUILD === 'true';
  const result = await publishRelease({ skipBuild });
  console.log('✅ 发布完成');
  console.table([
    {
      Version: result.version,
      Provider: result.uploadResult.provider,
      Tag: result.uploadResult.tagName,
    },
  ]);
};

main().catch((error) => {
  console.error('发布流程失败:', error.message ?? error);
  process.exitCode = 1;
});
