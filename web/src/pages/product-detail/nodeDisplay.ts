import type { WorkflowNode, WorkflowNodeType } from "../../lib/types";

const BASE_NODE_LABELS: Record<WorkflowNodeType, string> = {
  product_context: "商品资料",
  reference_image: "图片节点",
  copy_generation: "商品文案",
  image_generation: "生成图片",
};

const DEFAULT_TITLE_PREFIXES: Record<WorkflowNodeType, string> = {
  product_context: "商品资料",
  reference_image: "图片节点",
  copy_generation: "商品文案",
  image_generation: "生成图片",
};

const LEGACY_TITLE_PREFIXES: Record<WorkflowNodeType, string> = {
  product_context: "商品",
  reference_image: "参考图",
  copy_generation: "文案",
  image_generation: "生图",
};

const REFERENCE_ROLE_LABELS: Record<string, string> = {
  reference: "图片节点",
  style: "风格图",
  product_angle: "商品角度图",
  main_image: "主图",
  sku_image: "SKU 图",
  model_image: "模特图",
  scene_image: "场景图",
  detail_image: "详情图",
  campaign_image: "活动图",
  background: "背景图",
};

function stringConfig(node: Pick<WorkflowNode, "config_json">, key: string): string {
  const value = node.config_json[key];
  return typeof value === "string" ? value.trim() : "";
}

function legacyDefaultTitle(type: WorkflowNodeType, title: string): boolean {
  const trimmed = title.trim();
  const legacyPrefix = LEGACY_TITLE_PREFIXES[type];
  const defaultPrefix = DEFAULT_TITLE_PREFIXES[type];
  return (
    trimmed === legacyPrefix ||
    trimmed === defaultPrefix ||
    new RegExp(`^${legacyPrefix}\\s+\\d+$`).test(trimmed) ||
    new RegExp(`^${defaultPrefix}\\s+\\d+$`).test(trimmed)
  );
}

export function workflowNodeTypeLabel(type: WorkflowNodeType): string {
  return BASE_NODE_LABELS[type];
}

export function referenceSlotLabel(node: Pick<WorkflowNode, "config_json" | "title" | "node_type">): string {
  const explicitLabel = stringConfig(node, "label");
  if (explicitLabel) {
    return explicitLabel;
  }
  const roleLabel = REFERENCE_ROLE_LABELS[stringConfig(node, "role")];
  if (roleLabel) {
    return roleLabel;
  }
  const title = node.title.trim();
  if (title && !legacyDefaultTitle(node.node_type, title)) {
    return title;
  }
  return BASE_NODE_LABELS.reference_image;
}

export function workflowNodeDisplayLabel(node: Pick<WorkflowNode, "node_type" | "config_json" | "title">): string {
  if (node.node_type === "reference_image") {
    return referenceSlotLabel(node);
  }
  return BASE_NODE_LABELS[node.node_type];
}

export function workflowNodeDisplayTitle(node: Pick<WorkflowNode, "node_type" | "config_json" | "title">): string {
  const title = node.title.trim();
  if (title && !legacyDefaultTitle(node.node_type, title)) {
    return title;
  }
  return workflowNodeDisplayLabel(node);
}

export function defaultTitleForNodeType(type: WorkflowNodeType, index: number): string {
  return `${DEFAULT_TITLE_PREFIXES[type]} ${index}`;
}

export function connectionDescription(
  source: Pick<WorkflowNode, "node_type" | "config_json" | "title">,
  target: Pick<WorkflowNode, "node_type" | "config_json" | "title">,
): string {
  if (source.node_type === "reference_image" && target.node_type === "reference_image") {
    return "图片节点不能互连。";
  }
  if (source.node_type === "reference_image" && target.node_type === "copy_generation") {
    return `${workflowNodeDisplayTitle(source)}作为${workflowNodeDisplayTitle(target)}参考。`;
  }
  if (source.node_type === "image_generation" && target.node_type === "reference_image") {
    return `${workflowNodeDisplayTitle(source)}写入${workflowNodeDisplayTitle(target)}。`;
  }
  if (target.node_type === "image_generation") {
    return `${workflowNodeDisplayTitle(source)}作为生成参考。`;
  }
  return `${workflowNodeDisplayTitle(source)}连接到${workflowNodeDisplayTitle(target)}。`;
}
