declare module 'tiny-slider-react' {
  import * as React from 'react';

  interface TinySliderSettings {
    items?: number;
    controls?: boolean;
    mouseDrag?: boolean;
    loop?: boolean;
    rewind?: boolean;
    autoplay?: boolean;
    autoplayButtonOutput?: boolean;
    autoplayTimeout?: number;
    navPosition?: string;
    speed?: number;
    gutter?: number;
    
  }

  interface TinySliderProps {
    children: React.ReactNode;
    settings: TinySliderSettings;
  }

  const TinySlider: React.FC<TinySliderProps>;

  export default TinySlider;
}
