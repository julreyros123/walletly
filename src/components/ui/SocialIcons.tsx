import React from 'react';
import { Image } from 'expo-image';

// Correct, verified Base64 Google "G" Icon
const GOOGLE_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCI+PHBhdGggZmlsbD0iI0VBNDMzNSIgZD0iTTI0IDkuNWMzLjU0IDAgNi43MSAxLjIyIDkuMjEgMy42bDYuODUtNi44NUMzNS45IDIuMzggMzAuNDcgMCAyNCAwIDE0LjY2IDAgNi41OCA1LjM4IDIuNTYgMTMuMjJsNy45OCA2LjE5QzEyLjQzIDEzLjcyIDE3Ljc0IDkuNSAyNCA5LjV6Ii8+PHBhdGggZmlsbD0iIzQyODVGNCIgZD0iTTQ2Ljk4IDI0LjU1YzAtMS41Ny0uMTUtMy4wOS0uMzgtNC41NUgyNHY5LjAyaDEyLjk0Yy0uNTggMi45Ni0yLjI2IDUuNDgtNC43OCA3LjE4bDcuNzMgNmM0LjUxLTQuMTggNy4wOS0xMC4zNiA3LjA5LTE3LjY1eiIvPjxwYXRoIGZpbGw9IiNGQkJDMDUiIGQ9Ik0xMC41MyAyOC41OWMtLjQ4LTEuNDUtLjc2LTIuOTktLjc2LTQuNTlzLjI3LTMuMTQuNzYtNC41OWwtNy45OC02LjE5Qy45MiAxNi40NiAwIDIwLjEyIDAgMjRjMCAzLjg4LjkyIDcuNTQgMi41NiAxMC43OGw3Ljk3LTYuMTl6Ii8+PHBhdGggZmlsbD0iIzM0QTg1MyIgZD0iTTI0IDQ4YzYuNDggMCAxMS45My0yLjEzIDE1Ljg5LTUuODFsLTcuNzMtNmMtMi4xNSAxLjQ1LTQuOTIgMi4zLTguMTYgMi4zLTYuMjYgMC0xMS41Ny00LjIyLTEzLjQ3LTkuOTFsLTcuOTggNi4xOUM2LjU4IDQyLjYyIDE0LjY2IDQ4IDI0IDQ4eiIvPjwvc3ZnPg==';

// Correct, verified Base64 Facebook circular Icon
const FACEBOOK_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCI+PGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjQiIGZpbGw9IiMxODc3RjIiLz48cGF0aCBmaWxsPSIjRkZGRkZGIiBkPSJNMjkuMjUgMjRIMjUuNXYxMy41aC01LjYyNVYyNGgtMi44MTI1di00Ljc4MTI1SDE5Ljg3NXYtMy4wOTM3NWMwLTMuODY5MDYyIDEuODY5ODQ0LTUuOTA2MjUgNS40MDkzNzUtNS45MDYyNSAxLjY5NTQ2OSAwIDMuNDY1OTM4LjMwMzc1IDMuNDY1OTM4LjMwMzc1djMuODEwOTM4aC0xLjk1MjgxM2MtMS45MTcxODcgMC0yLjUxNjI1IDEuMTg5Njg3LTIuNTE2MjUgMi40MTMxMjV2Mi40NzIxODdoNC4zMDMxMjVMMjkuMjUgMjR6Ii8+PC9zdmc+';

export function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Image
      source={{ uri: GOOGLE_BASE64 }}
      style={{ width: size, height: size }}
      contentFit="contain"
    />
  );
}

export function FacebookIcon({ size = 20 }: { size?: number }) {
  return (
    <Image
      source={{ uri: FACEBOOK_BASE64 }}
      style={{ width: size, height: size }}
      contentFit="contain"
    />
  );
}
