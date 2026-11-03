// WeChat cloud function: applyLabel
// Downloads a generated image from cloud storage, embeds the implicit AIGC
// label (metadata), uploads the labeled copy and returns its fileID.
//
// Environment variables (set in the cloud console — never in code):
//   AIGC_PROVIDER_NAME   your company name (the service provider)
//   AIGC_PROVIDER_CODE   your provider code (e.g. unified social credit code)
//
// The explicit (visible) label must be burned into pixels BEFORE this
// function runs — see burnExplicitLabel() in the example README for a
// sharp-based snippet using the kit's SVG overlay spec.
const cloud = require('wx-server-sdk');
const { labelImage } = require('aigc-label-kit');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { fileID, taskId } = event;
  if (!fileID) return { ok: false, error: 'fileID is required' };

  const { fileContent } = await cloud.downloadFile({ fileID });
  const { buffer, payload } = labelImage(fileContent, {
    providerName: process.env.AIGC_PROVIDER_NAME,
    providerCode: process.env.AIGC_PROVIDER_CODE,
  });

  const cloudPath = `labeled/${payload.ContentID}.png`;
  const { fileID: labeledFileID } = await cloud.uploadFile({ cloudPath, fileContent: buffer });

  // Keep the content ID -> task mapping so any exported file stays traceable.
  if (taskId) {
    await db.collection('generation_tasks').doc(taskId).update({
      data: { contentId: payload.ContentID, labeledFileID, labeledAt: db.serverDate() },
    });
  }
  return { ok: true, fileID: labeledFileID, contentId: payload.ContentID };
};
