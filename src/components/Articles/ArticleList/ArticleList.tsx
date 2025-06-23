import React from 'react';
import ArticleCard from '../ArticleCard/ArticleCard';
import './ArticleList.scss';

// Placeholder data based on the mockup
const articles = [
    {
        imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDeKRn7bin6zAaLP-T08KBSn-fsRDEV9tD_U7bI3H_FJV_dpyZSZanTtcarDL2lCFMl4UHVGyQIXgPvTuR7STs5nhlO4JsPSVQeRgjjQdmUnD8kOMYPLQGvopwRNKYCTj760IIO3Vde1UYWExKQ7Hk1tVmyMYrS12oUmE_FBwyZbPwPHt2D9T7V8bSplsnj8jP86DN_RSYOkk1SD5AY7ubDUaMNY_cNz0k5W3JN9XXsYRsgjLlJXWFqT-b8jKPF8w41xb11yEWok_g",
        title: "The Future of Work: Remote Collaboration Tools",
        description: "Explore the latest tools and strategies for effective remote teamwork."
    },
    {
        imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBYwPo_eN6P4OlT5_oh6NNNRja4CT773addNvhWm0OhtwFdQrmyO37U8TIxVsEMGlWHzieMFv1fZ-17cM3ViRtJrn-PyXb5pusctPpG52C9r4bm85QmNniaTVjTsWL5S-80NKswH0Np_gpdN5zQKhm59hWimiMo_WJWrUTStpHQwavTdK-8Q5aOle79O1gChDwbsAUyjSejUaFk82IFkIsuCpQa-1TMXHK7uwyQtTOvVy4_QA8NKIol27oC0lJvZ_sOX_y3UA76LYo",
        title: "Sustainable Living: Tips for Eco-Friendly Homes",
        description: "Learn how to make your home more environmentally friendly with these practical tips."
    },
    {
        imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDX7G8CITM9ESFaQPatVVq6IraOoO53aKENj2biCn6gLzNHGdzntfeE8lJ4zsxaXNmT7QWZjeC3WLXCYh4IfbGMNYrkuMC5Ko3rkKpd2Ws-JUbMjZncGPkViiSK7ccIwVdtQdOCCS6WpA_8NnbRYgy9xLGUSw-U32BdBnrRPHB-22-2J8DNTtaphjoY3ib4pDqLOJ7M8y_Q6NO1gVV6Z7kmcj-26iL9SUVNYL9_cq_GD1tspHFZk0KmZRIey9EvUfZ-IuDymzFktUU",
        title: "Mastering Time Management: Productivity Hacks",
        description: "Boost your productivity with proven time management techniques."
    },
    {
        imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBPec4UI4Kuoqxi0B-lGqClECcxvA_lv-qAMvdX6LglKtk830a21zC7nUegrO6vh4dRywkexWqQwETQDTHL8DzvFG-0wiYboeiIPHB2o8jYycRV1oRwpejzQc3hq6PUo3dGCgKfD840uwsBmTe-cvCohXWPPuRGAQTO5uiY1-0pRtcygiw3q19ydM9AecC3E1KNsfxc3Wt1BrqwiJnutG6noSPCcrgIa3rzorWND5vFsoG1G-bjjexreqXuZgPHwvIij5X86GbtWto",
        title: "The Art of Photography: Capturing Moments",
        description: "Discover the techniques and artistry behind stunning photography."
    },
    {
        imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBwu3IrT6H1Z-zZhQ-_9-VFoeN0O34WCm_BCbJPSRpwUiruLlmliBfoE6qqTx9brpfnLE4ue9NV7WHQGUPZ4cJeK8YOaoEV2R6t-MJnvDDO0h46eRTtSBjK70zdWZrEZKqKD4zHemnMMYO1IUb_LlqmXDkxCvyTNjO3Ted0FcgY3is3avRPiGTPE1ndROHk9WIXIr7vL3d1WQelOmvdm-P5ezbmYm9Naq1v6t-849pf2d6q16hHsVmbT_-OXt8mo4lv1L46tQuXVJ8",
        title: "Healthy Eating: Delicious and Nutritious Recipes",
        description: "Enjoy a variety of healthy and tasty recipes for a balanced diet."
    },
    {
        imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCuuTNTiHITCdZ5Kxx2tv0ajIrE0zeEM5q-To3Ce2ekohXL8OFEDOtZ_GTKZB5VjLuLxh-I047ap7HK-JVO2QcMhVX7gGaW-YWT1HGPNZgrxQuSIuitc2ic7E8iMOAqYHGEYhWg0kYkKn_yi2OV8z_yRM_SuzGmHjrWbfPPsBSjZ5vc-ml2EQ0-xaQjcmkfdIagPUs14Uqr6FvipQZE4XbsbgOrX_fIb-qwbLuYx57ouPGp12rNzXcYhA9rEp6BqYOPXLsDsgv0XTg",
        title: "Exploring Space: Latest Discoveries and Missions",
        description: "Stay updated on the latest space explorations and groundbreaking missions."
    }
];

const ArticleList: React.FC = () => {
    return (
        <div className="article-list-container">
            <div className="input-container">
                <div className="input-bar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                        <path
                            d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"
                        ></path>
                    </svg>
                    <input type="text" placeholder="Paste link here" />
                </div>
            </div>
            <h2 className="list-title">My List</h2>
            <div className="article-grid">
                {articles.map((article, index) => (
                    <ArticleCard
                        key={index}
                        imageUrl={article.imageUrl}
                        title={article.title}
                        description={article.description}
                    />
                ))}
            </div>
        </div>
    );
};

export default ArticleList; 