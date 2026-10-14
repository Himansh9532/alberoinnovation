import assert from "node:assert/strict";
import test from "node:test";
import { getPhotoBytes, MAX_RESUME_PHOTO_BYTES, resizeResumePhoto } from "./resume-photo.js";

test("resume photos reject unsupported formats and files over 10 MB", async () => {
  await assert.rejects(resizeResumePhoto({ type: "image/gif", size: 100 }), /Choose a JPG, PNG, or WebP photo/);
  await assert.rejects(resizeResumePhoto({ type: "image/jpeg", size: MAX_RESUME_PHOTO_BYTES + 1 }), /smaller than 10 MB/);
});

test("DOCX photo decoding accepts resized JPEG data URLs only", () => {
  assert.deepEqual(getPhotoBytes("data:image/jpeg;base64,AQID"), new Uint8Array([1, 2, 3]));
  assert.equal(getPhotoBytes("data:image/png;base64,AQID"), null);
  assert.equal(getPhotoBytes("not-an-image"), null);
});