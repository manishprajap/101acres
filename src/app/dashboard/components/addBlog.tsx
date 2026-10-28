'use client'
import React,{useState} from "react";
import Link from "next/link"
import Image from "next/image";
import { FiPlus } from "react-icons/fi";

export default function AddBlog(){
    let [ show, setShow ] = useState<boolean>(false);
    const [file, setFile] = useState<string | undefined>(undefined);

    
    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files && e.target.files.length > 0) {
            setFile(URL.createObjectURL(e.target.files[0]));
        }
    }
    return(
        <>
        <div>
            <Link href="#" className="h-8 w-8 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-[20px] text-center bg-slate-800/5 hover:bg-slate-800/10 dark:bg-slate-700 border border-slate-100/5 dark:border-gray-700 text-slate-900 dark:text-white rounded-full" onClick={() =>setShow(true)}><FiPlus className="h-4 w-4"/></Link>
        </div>
        <div className={`${show ? '' : 'hidden'} fixed z-50  flex items-center justify-center overflow-hidden m-auto bg-slate-900/50 dark:bg-slate-900/80 inset-0`}>
            <div className="relative w-full h-auto max-w-lg p-4">
                <div className="relative bg-white dark:bg-slate-900 rounded-lg shadow-sm shadow-gray-200 dark:shadow-gray-700">
                    <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700">
                        <h5 className="text-xl font-semibold">Add blog or news</h5>
                        <button type="button" onClick={() =>setShow(false)} className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ms-auto inline-flex items-center dark:hover:bg-gray-800 dark:hover:text-white">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>  
                        </button>
                    </div>
                    <div className="p-4">
                        <div>
                            <p className="font-semibold mb-4">Upload your blog image here, Please click &quto;Upload Image&quto; Button.</p>
                            
                            {file ? 
                                <Image src={file} alt="" width={0} height={0} sizes="100vw" style={{width:'100%', height:'auto'}}/> :
                                <div className="preview-box flex justify-center rounded-md shadow-sm dark:shadow-gray-800 overflow-hidden bg-gray-50 dark:bg-slate-800 text-slate-400 p-2 text-center small w-auto max-h-60">Supports JPG, PNG and MP4 videos. Max file size : 10MB.</div>
                            }

                            <input type="file" id="input-file" name="input-file" accept="image/*" onChange={handleChange}  hidden/>
                            <label className="btn-upload py-2 px-5 inline-block font-semibold tracking-wide border align-middle duration-500 text-base text-center bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700 text-white rounded-md mt-6 cursor-pointer" htmlFor="input-file">Upload Image</label>
                        </div>
                        
                        <form className="mt-4">
                            <div className="grid grid-cols-12 gap-3">
                                <div className="col-span-12">
                                    <label className="font-semibold">Blog Title <span className="text-red-600">*</span></label>
                                    <input name="name" id="name" type="text" className="form-input w-full py-2 px-3 h-10 bg-transparent dark:bg-slate-900 dark:text-slate-200 rounded outline-none border !border-gray-200 focus:!border-green-600 dark:!border-gray-800 dark:focus:!border-green-600 focus:ring-0 mt-2" placeholder="Title :"/>
                                </div>

                                <div className="col-span-12">
                                    <label className="font-semibold"> Description : </label>
                                    <textarea name="comments" id="comments" className="form-input w-full py-2 px-3 !h-24 bg-transparent dark:bg-slate-900 dark:text-slate-200 rounded outline-none border !border-gray-200 focus:!border-green-600 dark:!border-gray-800 dark:focus:!border-green-600 focus:ring-0 mt-2" placeholder="Description :"></textarea>
                                </div>

                                <div className="col-span-12">
                                    <button type="submit" className="btn bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700 text-white rounded-md">Create Blog</button>
                                </div>
                            </div>
                        </form>
                    </div>                    
                </div>
            </div>
        </div>
        </>
    )
}