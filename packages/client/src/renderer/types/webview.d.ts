import type { DetailedHTMLProps, HTMLAttributes } from 'react';
import type { WebviewTag } from 'electron';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      webview: DetailedHTMLProps<HTMLAttributes<WebviewTag>, WebviewTag> & {
        src?: string;
        nodeintegration?: boolean;
        webpreferences?: string;
        allowpopups?: boolean;
      };
    }
  }
}

export {};
