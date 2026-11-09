/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { useEffect, useState } from 'react';
import { BOREALIS_THEME, contrastRolesStore } from '@kbn/contrast-roles';
import type { Extracted, GeneratedBrand } from '@kbn/brand-hues';
import type { BrandGeneratorOptions } from '../../common';

// The generator and its color naming data are large, so they load only when the brand section needs them.
const loadBrandHues = () => import('@kbn/brand-hues');

const IMAGE_SIZE = 160;
const MAX_IMAGE_COLORS = 4;
const GENERATE_DELAY_MS = 300;

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

/** The main colors of an image, by share of its colored area. Images with no colored areas give Borealis teal. */
export const extractImageColors = async (src: string): Promise<Extracted[]> => {
  const [{ extractSeeds }, image] = await Promise.all([loadBrandHues(), loadImage(src)]);
  // SVGs without a width and height have no natural size.
  const width = image.naturalWidth || IMAGE_SIZE;
  const height = image.naturalHeight || IMAGE_SIZE;
  const scale = Math.min(1, IMAGE_SIZE / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('The browser could not read the image.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  return extractSeeds(data, MAX_IMAGE_COLORS, BOREALIS_THEME.hues[0].base);
};

export interface GeneratedBrandState {
  generated?: GeneratedBrand;
  isGenerating: boolean;
  error?: Error;
}

/** The brand hues for these colors and options, generated shortly after they stop changing. */
export const useGeneratedBrand = (
  colors: readonly string[],
  { band, shuffle }: BrandGeneratorOptions
): GeneratedBrandState => {
  const [state, setState] = useState<GeneratedBrandState>({ isGenerating: false });
  const colorsKey = colors.join(',');

  useEffect(() => {
    if (colorsKey === '') {
      setState({ isGenerating: false });
      return;
    }
    let cancelled = false;
    setState((previous) => ({ ...previous, isGenerating: true }));
    const timer = setTimeout(async () => {
      try {
        const { generateBrand } = await loadBrandHues();
        if (cancelled) return;
        const { params } = contrastRolesStore.get();
        const generated = generateBrand(colorsKey.split(','), { params, band, shuffle });
        if (!cancelled) setState({ generated, isGenerating: false });
      } catch (error) {
        if (!cancelled) setState({ isGenerating: false, error });
      }
    }, GENERATE_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [colorsKey, band, shuffle]);

  return state;
};
