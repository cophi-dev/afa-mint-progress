export const AFA_EDITOR_BASE =
  process.env.REACT_APP_AFA_EDITOR_URL || 'https://www.afa-editor.app';

export const AFA_CLAIM_URL =
  process.env.REACT_APP_AFA_CLAIM_URL || 'https://www.apefacingapes.com/claim';

/** Deep-link into the editor with the minted AFA token prefilled. */
export function buildAfaEditorUrl(tokenId) {
  const params = new URLSearchParams({
    tokenId: String(tokenId),
    assetType: 'AFA',
  });
  return `${AFA_EDITOR_BASE}/?${params.toString()}`;
}
