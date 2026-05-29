import { Button as BaseButton } from "@base-ui/react/button";
import { forwardRef, useId, type ComponentPropsWithoutRef, type CSSProperties, type ReactNode } from "react";
import styles from "../../styles/contourButton.module.css";

export type ContourButtonVariant = "dark" | "yellow" | "red" | "white";
export type ContourButtonSize = "default" | "sm";
type ContourStyle = CSSProperties & Record<`--${string}`, string | number>;

interface VariantToken {
  outerBackground: string;
  outerBorder: string;
  outerShadow: string;
  innerBackground: string;
  innerBorder: string;
  innerShadow: string;
  innerShadowHover: string;
  innerShadowPress: string;
  lineColor: string;
  textColor: string;
  textShadow: string;
  iconBackground: string;
  iconBorder: string;
  iconShadow: string;
  iconColor: string;
  textureOpacity: number;
  textureMorphology: number;
  textureTable: string;
  textureColorMatrix: string;
}

interface SizeToken {
  outerHeight: number;
  outerWidth: number;
  padding: number;
  innerPaddingLeft: number;
  innerPaddingRight: number;
  iconSize: number;
  iconGlyph: number;
  lineHeight: number;
  gap: number;
  textFontSize: string;
  textLineHeight: string;
  textPaddingX: number;
  iconGap: number;
}

const variantTokens: Record<ContourButtonVariant, VariantToken> = {
  dark: {
    outerBackground:
      "linear-gradient(in oklab 180deg, oklab(95.3% 0.002 0.006) 0%, oklab(88.2% 0.004 0.011) 60%, oklab(81.5% 0.005 0.016) 100%)",
    outerBorder: "#FFFCF8FA",
    outerShadow:
      "#FFFFFFFA 0px 1px 0px inset, #6E635729 0px -5px 8px inset, #00000038 0px 10px 18px, #766C603D 0px 2px 0px",
    innerBackground:
      "linear-gradient(in oklab 180deg, oklab(46.9% 0.002 0.002) 0%, oklab(38% 0.002 0.004) 54%, oklab(34.5% .0004 0.004) 100%)",
    innerBorder: "#F3EFEB3D",
    innerShadow: "#FFFFFF24 0px 2px 0px inset, #0000003D 0px -8px 12px inset",
    innerShadowHover:
      "#FFFFFF24 0px 2px 0px inset, #0000003D 0px -8px 12px inset, rgba(255, 255, 255, 0.16) 0px 1px 0px inset",
    innerShadowPress:
      "#FFFFFF24 0px 2px 0px inset, #0000003D 0px -8px 12px inset, rgba(15, 23, 42, 0.22) 0px 5px 8px inset, rgba(255, 255, 255, 0.08) 0px 1px 0px",
    lineColor: "#FFF9F33D",
    textColor: "#F4F0EA",
    textShadow: "#00000024 0px 1px 0px",
    iconBackground:
      "linear-gradient(in oklab 180deg, oklab(96.6% 0.002 0.010) 0%, oklab(91.9% 0.005 0.015) 100%)",
    iconBorder: "#FFFFFFAD",
    iconShadow:
      "#FFFFFFF0 0px 1px 0px inset, #736B6124 0px -3px 7px inset, #00000033 0px 2px 8px",
    iconColor: "#474442",
    textureOpacity: 0.32,
    textureMorphology: 2.2,
    textureTable:
      ".26 .26 .26 .26 .44 .44 .44 .44 .62 .62 .62 .62 .78 .78 .78 .78 .9 .9 .9 .9 .98 .98 .98 .98 1 1 1 1 1 1 1 1",
    textureColorMatrix: "0 0 0 0 0.98 0 0 0 0 0.96 0 0 0 0 0.92 0 0 0 1 0",
  },
  white: {
    outerBackground:
      "linear-gradient(in oklab 180deg, oklab(95.3% 0.002 0.006) 0%, oklab(88.2% 0.004 0.011) 60%, oklab(81.5% 0.005 0.016) 100%)",
    outerBorder: "#FFFCF8FA",
    outerShadow:
      "#FFFFFFFA 0px 1px 0px inset, #6E635724 0px -5px 8px inset, #00000038 0px 10px 18px, #766C6038 0px 2px 0px",
    innerBackground:
      "linear-gradient(in oklab 180deg, oklab(97.6% -.0001 0.004) 0%, oklab(95% .0008 0.009) 58%, oklab(91.5% 0.002 0.015) 100%)",
    innerBorder: "#8B807524",
    innerShadow: "#FFFFFF70 0px 2px 0px inset, #746A5F0F 0px -8px 12px inset",
    innerShadowHover:
      "#FFFFFF70 0px 2px 0px inset, #746A5F0F 0px -8px 12px inset, rgba(255, 255, 255, 0.16) 0px 1px 0px inset",
    innerShadowPress:
      "#FFFFFF70 0px 2px 0px inset, #746A5F0F 0px -8px 12px inset, rgba(15, 23, 42, 0.22) 0px 5px 8px inset, rgba(255, 255, 255, 0.08) 0px 1px 0px",
    lineColor: "#5B51482E",
    textColor: "#413B36",
    textShadow: "#FFFFFF4D 0px 1px 0px",
    iconBackground:
      "linear-gradient(in oklab 180deg, oklab(34.5% .0008 0.002) 0%, oklab(28.1% -.0005 0.002) 100%)",
    iconBorder: "#FFFFFF29",
    iconShadow:
      "#FFFFFF1A 0px 1px 0px inset, #0000002E 0px -3px 7px inset, #0000002E 0px 2px 8px",
    iconColor: "#F7F3EB",
    textureOpacity: 0.6,
    textureMorphology: 2.35,
    textureTable:
      ".3 .3 .3 .3 .48 .48 .48 .48 .66 .66 .66 .66 .82 .82 .82 .82 .92 .92 .92 .92 .99 .99 .99 .99 1 1 1 1 1 1 1 1",
    textureColorMatrix: "0 0 0 0 0.19 0 0 0 0 0.17 0 0 0 0 0.14 0 0 0 1 0",
  },
  yellow: {
    outerBackground:
      "linear-gradient(in oklab 180deg, oklab(95.3% 0.002 0.006) 0%, oklab(88.2% 0.004 0.011) 60%, oklab(81.5% 0.005 0.016) 100%)",
    outerBorder: "#FFFCF8FA",
    outerShadow:
      "#FFFFFFFA 0px 1px 0px inset, #6E635724 0px -5px 8px inset, #00000033 0px 10px 18px, #766C6038 0px 2px 0px",
    innerBackground:
      "linear-gradient(in oklab 180deg, oklab(93.2% -0.046 0.162) 0%, oklab(89% -0.044 0.164) 58%, oklab(84.3% -0.041 0.160) 100%)",
    innerBorder: "#98891F38",
    innerShadow: "#FFFFFF42 0px 2px 0px inset, #95801224 0px -8px 12px inset",
    innerShadowHover:
      "#FFFFFF42 0px 2px 0px inset, #95801224 0px -8px 12px inset, rgba(255, 255, 255, 0.16) 0px 1px 0px inset",
    innerShadowPress:
      "#FFFFFF42 0px 2px 0px inset, #95801224 0px -8px 12px inset, rgba(15, 23, 42, 0.22) 0px 5px 8px inset, rgba(255, 255, 255, 0.08) 0px 1px 0px",
    lineColor: "#7364123D",
    textColor: "#5A5423",
    textShadow: "#FFF8B429 0px 1px 0px",
    iconBackground:
      "linear-gradient(in oklab 180deg, oklab(32.5% 0 0) 0%, oklab(26.9% 0 0) 100%)",
    iconBorder: "#FFF4BA3D",
    iconShadow:
      "#FFFFFF1A 0px 1px 0px inset, #0000002E 0px -3px 7px inset, #0000002E 0px 2px 8px",
    iconColor: "#F0E64A",
    textureOpacity: 0.68,
    textureMorphology: 2.35,
    textureTable:
      ".3 .3 .3 .3 .48 .48 .48 .48 .66 .66 .66 .66 .82 .82 .82 .82 .92 .92 .92 .92 .99 .99 .99 .99 1 1 1 1 1 1 1 1",
    textureColorMatrix: "0 0 0 0 0.18 0 0 0 0 0.15 0 0 0 0 0.015 0 0 0 1 0",
  },
  red: {
    outerBackground:
      "linear-gradient(in oklab 180deg, oklab(95.3% 0.002 0.006) 0%, oklab(88.2% 0.004 0.011) 60%, oklab(81.5% 0.005 0.016) 100%)",
    outerBorder: "#FFFCF8FA",
    outerShadow:
      "#FFFFFFFA 0px 1px 0px inset, #6E635724 0px -5px 8px inset, #00000038 0px 10px 18px, #766C6038 0px 2px 0px",
    innerBackground:
      "linear-gradient(in oklab 180deg, oklab(70.5% 0.166 0.085) 0%, oklab(66.3% 0.172 0.092) 56%, oklab(62.8% 0.179 0.097) 100%)",
    innerBorder: "#FFE8E438",
    innerShadow: "#FFFFFF33 0px 2px 0px inset, #981B1524 0px -8px 12px inset",
    innerShadowHover:
      "#FFFFFF33 0px 2px 0px inset, #981B1524 0px -8px 12px inset, rgba(255, 255, 255, 0.16) 0px 1px 0px inset",
    innerShadowPress:
      "#FFFFFF33 0px 2px 0px inset, #981B1524 0px -8px 12px inset, rgba(15, 23, 42, 0.22) 0px 5px 8px inset, rgba(255, 255, 255, 0.08) 0px 1px 0px",
    lineColor: "#FFF6F13D",
    textColor: "#FFF4F1",
    textShadow: "#8D1D161F 0px 1px 0px",
    iconBackground:
      "linear-gradient(in oklab 180deg, oklab(96.6% 0.002 0.010) 0%, oklab(91.9% 0.005 0.015) 100%)",
    iconBorder: "#FFFFFFAD",
    iconShadow:
      "#FFFFFFF0 0px 1px 0px inset, #736B6124 0px -3px 7px inset, #0000002E 0px 2px 8px",
    iconColor: "#EF5A52",
    textureOpacity: 0.34,
    textureMorphology: 2.2,
    textureTable:
      ".26 .26 .26 .26 .44 .44 .44 .44 .62 .62 .62 .62 .78 .78 .78 .78 .9 .9 .9 .9 .98 .98 .98 .98 1 1 1 1 1 1 1 1",
    textureColorMatrix: "0 0 0 0 0.98 0 0 0 0 0.93 0 0 0 0 0.90 0 0 0 1 0",
  },
};

const sizeTokens: Record<ContourButtonSize, SizeToken> = {
  default: {
    outerHeight: 48,
    outerWidth: 196,
    padding: 1.5,
    innerPaddingLeft: 12,
    innerPaddingRight: 3,
    iconSize: 28,
    iconGlyph: 13,
    lineHeight: 2,
    gap: 9,
    textFontSize: "12px",
    textLineHeight: "14px",
    textPaddingX: 6,
    iconGap: 6,
  },
  sm: {
    outerHeight: 34,
    outerWidth: 112,
    padding: 2,
    innerPaddingLeft: 7,
    innerPaddingRight: 3,
    iconSize: 18,
    iconGlyph: 8,
    lineHeight: 2,
    gap: 3,
    textFontSize: "8px",
    textLineHeight: "10px",
    textPaddingX: 3,
    iconGap: 3,
  },
};

export interface ContourButtonProps
  extends Omit<ComponentPropsWithoutRef<typeof BaseButton>, "children"> {
  variant?: ContourButtonVariant;
  size?: ContourButtonSize;
  icon?: ReactNode;
  iconOnly?: boolean;
  reverse?: boolean;
  children?: ReactNode;
}

function ContourTexture({ tokens }: { tokens: VariantToken }) {
  const id = useId().replace(/:/g, "");
  const gradientId = `contour-gradient-${id}`;
  const maskId = `contour-mask-${id}`;
  const filterId = `contour-filter-${id}`;

  return (
    <svg
      aria-hidden="true"
      className={styles.texture}
      preserveAspectRatio="none"
      style={{
        left: "-128%",
        top: "-320%",
        width: "360%",
        height: "720%",
        opacity: tokens.textureOpacity,
      }}
      viewBox="0 0 960 220"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" x2="100%" y1="0%" y2="0%">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="18%" stopColor="white" stopOpacity="0.05" />
          <stop offset="38%" stopColor="white" stopOpacity="0.3" />
          <stop offset="60%" stopColor="white" stopOpacity="0.86" />
          <stop offset="100%" stopColor="white" stopOpacity="1" />
        </linearGradient>
        <mask id={maskId}>
          <rect fill={`url(#${gradientId})`} height="220" width="960" />
        </mask>
        <filter id={filterId} x="0%" y="0%" width="100%" height="100%">
          <feTurbulence baseFrequency=".0105" numOctaves="3" result="noise" seed="641746" type="fractalNoise" />
          <feComponentTransfer in="noise" result="bump">
            <feFuncA tableValues="0 0 1 1" type="table" />
            <feFuncR amplitude="0" type="gamma" />
            <feFuncG amplitude="0" type="gamma" />
            <feFuncB amplitude="0" type="gamma" />
          </feComponentTransfer>
          <feMorphology in="bump" operator="dilate" radius={tokens.textureMorphology} result="expanded" />
          <feConvolveMatrix in="expanded" kernelMatrix="9 9 9 9 -72 9 9 9 9" result="fine" />
          <feComponentTransfer in="expanded">
            <feFuncA tableValues={tokens.textureTable} type="discrete" />
          </feComponentTransfer>
          <feConvolveMatrix kernelMatrix="5 6 5 6 -44 6 5 6 5" result="medium" />
          <feMerge>
            <feMergeNode in="fine" />
            <feMergeNode in="medium" />
          </feMerge>
          <feColorMatrix values={tokens.textureColorMatrix} />
        </filter>
      </defs>
      <rect filter={`url(#${filterId})`} height="220" mask={`url(#${maskId})`} width="960" />
    </svg>
  );
}

export const ContourButton = forwardRef<HTMLElement, ContourButtonProps>(
  (
    {
      variant = "dark",
      size = "default",
      icon,
      iconOnly = false,
      reverse = false,
      children,
      className,
      style,
      ...props
    },
    ref,
  ) => {
    const variantToken = variantTokens[variant];
    const sizeToken = sizeTokens[size];
    const cssVars: ContourStyle = {
      "--contour-outer-background": variantToken.outerBackground,
      "--contour-outer-border": variantToken.outerBorder,
      "--contour-outer-shadow": variantToken.outerShadow,
      "--contour-outer-shadow-hover": `${variantToken.outerShadow}, rgba(15, 23, 42, 0.16) 0px 20px 30px -22px`,
      "--contour-outer-shadow-press": `${variantToken.outerShadow}, rgba(15, 23, 42, 0.18) 0px 2px 0px inset, rgba(15, 23, 42, 0.12) 0px 4px 8px -8px`,
      "--contour-inner-background": variantToken.innerBackground,
      "--contour-inner-border": variantToken.innerBorder,
      "--contour-inner-shadow": variantToken.innerShadow,
      "--contour-inner-shadow-hover": variantToken.innerShadowHover,
      "--contour-inner-shadow-press": variantToken.innerShadowPress,
      "--contour-line": variantToken.lineColor,
      "--contour-text": variantToken.textColor,
      "--contour-text-shadow": variantToken.textShadow,
      "--contour-icon-background": variantToken.iconBackground,
      "--contour-icon-border": variantToken.iconBorder,
      "--contour-icon-shadow": variantToken.iconShadow,
      "--contour-icon-color": variantToken.iconColor,
      "--contour-gap": `${sizeToken.gap}px`,
      "--contour-outer-padding": `${sizeToken.padding}px`,
      "--contour-inner-padding-left": `${sizeToken.innerPaddingLeft}px`,
      "--contour-inner-padding-right": `${sizeToken.innerPaddingRight}px`,
      "--contour-icon-size": `${sizeToken.iconSize}px`,
      "--contour-icon-glyph": `${sizeToken.iconGlyph}px`,
      "--contour-line-height": `${sizeToken.lineHeight}px`,
      "--contour-text-font-size": sizeToken.textFontSize,
      "--contour-text-line-height": sizeToken.textLineHeight,
      "--contour-text-padding-x": `${sizeToken.textPaddingX}px`,
      "--contour-icon-gap": `${sizeToken.iconGap}px`,
      width: iconOnly ? `${sizeToken.outerHeight}px` : `${sizeToken.outerWidth}px`,
      minWidth: iconOnly ? `${sizeToken.outerHeight}px` : `${sizeToken.outerWidth}px`,
      height: `${sizeToken.outerHeight}px`,
      ...style,
    };

    const labelBlock = iconOnly ? null : (
      <span className={styles.track}>
        {reverse ? <span className={styles.label}>{children}</span> : <span className={styles.line} />}
        {reverse ? <span className={styles.line} /> : <span className={styles.label}>{children}</span>}
      </span>
    );

    return (
      <BaseButton
        {...props}
        className={[styles.shell, className].filter(Boolean).join(" ")}
        data-direction={reverse ? "reverse" : "forward"}
        data-icon-only={iconOnly}
        data-size={size}
        ref={ref}
        style={cssVars}
      >
        <span className={styles.inner}>
          <ContourTexture tokens={variantToken} />
          <span aria-hidden="true" className={styles.sheen} />
          {reverse && icon ? <span className={styles.icon}>{icon}</span> : null}
          {iconOnly && icon ? <span className={styles.icon}>{icon}</span> : null}
          {labelBlock}
          {!iconOnly && !reverse && icon ? <span className={styles.icon}>{icon}</span> : null}
        </span>
      </BaseButton>
    );
  },
);

ContourButton.displayName = "ContourButton";
