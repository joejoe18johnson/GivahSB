"use client";

import { useState, useEffect } from "react";

interface SafeImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fallback?: React.ReactNode;
}

export default function SafeImage({
  src,
  alt,
  fill,
  width,
  height,
  className = "",
  sizes,
  priority,
  fallback,
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageSrc, setImageSrc] = useState(src);

  useEffect(() => {
    // Reset when src changes
    setHasError(false);
    setIsLoading(true);
    setImageSrc(src);

    if (!src || src.trim() === "") {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    // Preload image to check if it loads
    const img = new Image();
    let isMounted = true;

    img.onload = () => {
      if (isMounted) {
        setIsLoading(false);
        setHasError(false);
      }
    };
    img.onerror = () => {
      if (isMounted) {
        setIsLoading(false);
        setHasError(true);
      }
    };
    
    // Set src after setting up handlers
    img.src = src;

    return () => {
      isMounted = false;
    };
  }, [src]);

  const defaultFallback = (
    <div className={`bg-gradient-to-br from-primary-300 to-primary-500 flex items-center justify-center ${fill ? "absolute inset-0" : ""} ${className}`}>
      <span className="text-primary-800 text-2xl font-semibold">
        {alt.charAt(0).toUpperCase()}
      </span>
    </div>
  );

  if (hasError || !imageSrc || imageSrc.trim() === "") {
    return <>{fallback || defaultFallback}</>;
  }

  const imageStyle: React.CSSProperties = fill
    ? {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
      }
    : {
        width: width || "100%",
        height: height || "auto",
      };

  return (
    <>
      {fill ? (
        <div className="relative w-full h-full">
          {isLoading && !hasError && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center z-0">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt={alt}
            className={`${className} ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
            style={imageStyle}
            onError={() => {
              setHasError(true);
              setIsLoading(false);
            }}
            onLoad={() => {
              setIsLoading(false);
              setHasError(false);
            }}
            loading={priority ? "eager" : "lazy"}
          />
        </div>
      ) : (
        <div className="relative" style={{ width: width || "100%", height: height || "auto" }}>
          {isLoading && !hasError && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center z-0">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt={alt}
            width={width}
            height={height}
            className={`${className} ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
            style={imageStyle}
            onError={() => {
              setHasError(true);
              setIsLoading(false);
            }}
            onLoad={() => {
              setIsLoading(false);
              setHasError(false);
            }}
            loading={priority ? "eager" : "lazy"}
          />
        </div>
      )}
    </>
  );
}
