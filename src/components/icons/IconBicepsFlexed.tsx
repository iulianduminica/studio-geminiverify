import React from 'react';

const IconBicepsFlexed = (props: React.SVGProps<SVGSVGElement>) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        {...props}
    >
        <path d="M3.5 13.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
        <path d="M8.5 13.5h-3" />
        <path d="M14.5 13.5h3" />
        <path d="M19.5 13.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
        <path d="M8.5 11.5c0-3.5 1.5-5 4-5" />
        <path d="M14.5 11.5c0-3.5-1.5-5-4-5" />
    </svg>
);

export default IconBicepsFlexed;
