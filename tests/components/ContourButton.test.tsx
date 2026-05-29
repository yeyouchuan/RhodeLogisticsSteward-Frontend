import { render, screen } from "@testing-library/react";
import { DownloadSimpleIcon } from "@phosphor-icons/react";
import { describe, expect, it } from "vitest";
import { ContourButton } from "../../src/components/ui/ContourButton";

describe("ContourButton", () => {
  it("renders variants and disabled state", () => {
    render(
      <>
        <ContourButton icon={<DownloadSimpleIcon />} variant="dark">导出</ContourButton>
        <ContourButton disabled size="sm" variant="red">删除</ContourButton>
      </>,
    );

    expect(screen.getByRole("button", { name: "导出" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "删除" })).toBeDisabled();
  });
});
