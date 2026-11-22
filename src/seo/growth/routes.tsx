// Route wrappers for the growth pages (read the :slug and render the page).
import { useParams } from "react-router-dom";
import { ToolPage } from "./tools/ToolPages";
import { InvoiceTemplatePage } from "./InvoiceTemplates";

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
