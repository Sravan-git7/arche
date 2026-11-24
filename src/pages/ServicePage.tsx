import { usePage } from "../lib/router";
import { useReveal, useParallax } from "../lib/reveal";
import { ServiceDetailLayout } from "../components/ServiceDetailLayout";
import { getServiceDetail } from "../data/serviceDetails";

export function ServicePage({ slug }: { slug: string }) {
  const service = getServiceDetail(slug);
  usePage(
    service
      ? `${service.title} | ARCHE Creative Studios`
      : "Services | ARCHE Creative Studios"
  );
  useReveal();
  useParallax();

  return <ServiceDetailLayout slug={slug} />;
}
