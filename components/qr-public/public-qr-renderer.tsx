import type { QRContent } from "@/lib/qr/types";
import { AppsPublicPage } from "./apps-public-page";
import { AudioPublicPage } from "./audio-public-page";
import { BusinessPublicPage } from "./business-public-page";
import { CouponPublicPage } from "./coupon-public-page";
import { ImagesPublicPage } from "./images-public-page";
import { LinksPublicPage } from "./links-public-page";
import { MenuPublicPage } from "./menu-public-page";
import { PdfPublicPage } from "./pdf-public-page";
import { publicResolver, type PublicAssetRow } from "./resolver";
import { SocialPublicPage } from "./social-public-page";
import { VideoPublicPage } from "./video-public-page";

/**
 * Destination registry for published /q/[slug] pages — one renderer
 * per hosted type instead of a giant switch in the route. Direct
 * types never publish, so they have no entry here.
 */
export function PublicQRRenderer({
  content,
  assets,
}: {
  content: QRContent;
  assets: PublicAssetRow[];
}) {
  const resolveAsset = publicResolver(assets);

  switch (content.type) {
    case "pdf":
      return <PdfPublicPage data={content.data} resolveAsset={resolveAsset} />;
    case "links":
      return <LinksPublicPage data={content.data} resolveAsset={resolveAsset} />;
    case "business":
      return <BusinessPublicPage data={content.data} resolveAsset={resolveAsset} />;
    case "video":
      return <VideoPublicPage data={content.data} resolveAsset={resolveAsset} />;
    case "images":
      return <ImagesPublicPage data={content.data} resolveAsset={resolveAsset} />;
    case "social":
      return <SocialPublicPage data={content.data} resolveAsset={resolveAsset} />;
    case "mp3":
      return <AudioPublicPage data={content.data} resolveAsset={resolveAsset} />;
    case "menu":
      return <MenuPublicPage data={content.data} resolveAsset={resolveAsset} />;
    case "apps":
      return <AppsPublicPage data={content.data} resolveAsset={resolveAsset} />;
    case "coupon":
      return <CouponPublicPage data={content.data} resolveAsset={resolveAsset} />;
    default:
      return null;
  }
}
