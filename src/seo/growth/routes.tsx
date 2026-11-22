// Route wrappers for the growth pages (read the :slug and render the page).
import { useParams } from "react-router-dom";
import { ToolPage } from "./tools/ToolPages";
import { InvoiceTemplatePage } from "./InvoiceTemplates";
import { ComparePage, CompareIndex } from "./Compare";

export { SoftwarePage } from "./SoftwarePages";
export { ToolsIndex } from "./tools/ToolPages";
export { InvoiceTemplatesIndex } from "./InvoiceTemplates";

export const ToolRoute = () => {
  const { slug = "" } = useParams();
  return <ToolPage slug={slug} />;
};

export const InvoiceTemplateRoute = () => {
  const { slug = "" } = useParams();
  return <InvoiceTemplatePage slug={slug} />;
};

export const CompareIndexRoute = () => <CompareIndex />;
export const CompareRoute = () => {
  const { slug = "" } = useParams();
  return slug === "best-quoting-software-uk" ? <CompareIndex roundup /> : <ComparePage slug={slug} />;
};
