import WebContent  from '../models/WebContent.model.js';
import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import uploadImage from '../utils/cloudinary.js';

// Hero Content update data  controller
const updateHeroContent = asyncHandler(async (req, res, next) => {
  try {
    const { heroTitle, heroDescription, heroVideoUrl } = req.body;
    const heroImageFile = req.files?.heroImage?.[0]?.path || null;

    // Retrieve the existing WebContent
    const webContent = await WebContent.findById('674de9d4a2c15b0876c21be5');
    if (!webContent) {
      return next(new ApiResponse(400, "WebContent not found", "WebContent not found"));
    }

    // Update hero content fields
    if (heroTitle) webContent.hero.heroTitle = heroTitle;
    if (heroDescription) webContent.hero.heroDescription = heroDescription;
    if (heroVideoUrl) webContent.hero.heroVideoUrl = heroVideoUrl;

    // If heroImageFile exists, upload and update the heroImage field
    if (heroImageFile) {
      const uploadedImageUrl = await uploadImage(heroImageFile);
      webContent.hero.heroImage = uploadedImageUrl;
    }

    // Save the updated WebContent to the database
    await webContent.save();

    // Send success response
    res.status(200).json(ApiResponse("success", webContent.hero, "Hero content updated successfully"));
  } catch (error) {
    // Handle unexpected errors
    next(error);
  }
});

// BrandPartners Content update,add new data and delete controller

const updateBrandPartnersContent = asyncHandler(async (req, res, next) => {
  const { brandPevContentUpdate, NewbrandContentAdd, brandContentDelete } =
    req.body;

  // Retrieve the existing WebContent
  const webContent = await WebContent.findById("674efd6a7d4788194ecd519a");

  if (!webContent) {
    return next(
      new ApiResponse(400, "WebContent not found", "WebContent not found")
    );
  }

// Update BrandPartners content fields
if (brandPevContentUpdate && Array.isArray(brandPevContentUpdate)) {
  brandPevContentUpdate.forEach(({ brandId, brandName, brandLogo }) => {
    if (brandId) {
      const brandPartner = webContent.BrandPartners.id(brandId);

      // Update fields only if they exist
      if (brandPartner) {
        if (brandName) brandPartner.brandName = brandName;
        if (brandLogo) brandPartner.brandLogo = brandLogo;
      }
    }
  });
}




// If brandName and brandLogo exist, add a new BrandPartners object
if (NewbrandContentAdd && Array.isArray(NewbrandContentAdd)) {
  NewbrandContentAdd.forEach(({ brandName, brandLogo }) => {
    // Add a new BrandPartners object only if both brandName and brandLogo exist
    if (brandName && brandLogo) {
      webContent.BrandPartners.push({ brandName, brandLogo });
    }
  });
}



  // If deleteobj exists, delete the BrandPartners object

  if (Array.isArray(brandContentDelete) && brandContentDelete.length > 0) {
    brandContentDelete.forEach((brandId) => {
      webContent.BrandPartners.pull({ _id: brandId });
    });
  }

  // Save the updated WebContent to the database
  await webContent.save();

  // Send success response
  res
    .status(200)
    .json(
      ApiResponse(
        200,
        webContent.BrandPartners,
        "BrandPartners content updated successfully",
        true
      )
    );


  //   // Retrieve the existing WebContent
  //   const webContent = await WebContent.findById('674efd6a7d4788194ecd519a');
  //   if (!webContent) {
  //     return next(new ApiResponse(400, "WebContent not found", "WebContent not found"));
  //   }

  // // If brandName exists, update the BrandPartners object
  // if (brandId) {
  //    if(brandName){
  //     webContent.BrandPartners.id(brandId).brandName = brandName;
  //    }
  //   // If brandLogo exists, upload and update the brandLogo field
  //   if (brandLogo) {
  //     webContent.BrandPartners.id(brandId).brandLogo = brandLogo;

  //   }
  // }

  //   // If brandName and brandLogo exist, add a new BrandPartners object

  //   if (brandName && brandLogo) {
  //     webContent.BrandPartners.push({ brandName, brandLogo });
  //   }

  //   // If deleteobj exists, delete the BrandPartners object
  //   if (deleteobj) {
  //     webContent.BrandPartners.pull({ _id: deleteobj });
  //   }

  //   // Save the updated WebContent to the database
  //   await webContent.save();

  //   // Send success response
  //   res.status(200).json(ApiResponse("success", webContent.BrandPartners, "BrandPartners content updated successfully"));
});

// services Content update,add new data and delete controller

const updateServicesContent = asyncHandler(async (req, res, next) => {
  const { servicesContentUpdate, NewServicesContentAdd, servicesContentDelete } = req.body;

  // Retrieve the existing WebContent
  const webContent = await WebContent.findById("674efd6a7d4788194ecd519a");

  if (!webContent) {
    return next(
      new ApiResponse(400, "WebContent not found", "WebContent not found")
    );
  }

// Update Services content fields
if (servicesContentUpdate && Array.isArray(servicesContentUpdate)) {
  servicesContentUpdate.forEach(({ serviceId, serviceName, serviceDescription }) => {
    if (serviceId) {
      const service = webContent.Services.id(serviceId);

      // Update fields only if they exist
      if (service) {
        if (serviceName) service.serviceName = serviceName;
        if (serviceDescription) service.serviceDescription = serviceDescription;
      }
    }
  });
}

// If serviceName and serviceDescription exist, add a new Services object

if (NewServicesContentAdd && Array.isArray(NewServicesContentAdd)) {
  NewServicesContentAdd.forEach(({ serviceName, serviceDescription }) => {
    // Add a new Services object only if both serviceName and serviceDescription exist
    if (serviceName && serviceDescription) {
      webContent.Services.push({ serviceName, serviceDescription });
    }
  });
}

// If deleteobj exists, delete the Services object 

if (Array.isArray(servicesContentDelete) && servicesContentDelete.length > 0) {
  servicesContentDelete.forEach((serviceId) => {
    webContent.Services.pull({ _id: serviceId });
  });
}


  // Save the updated WebContent to the database

  await webContent.save();

  // Send success response
  res.status(200).json(ApiResponse(200,webContent.Services,"Services content updated successfully",true));


});

// WhyChooseUs Content update,add new data and delete controller

const updateWhyChooseUsContent = asyncHandler(async (req, res, next) => {
  const { whyChooseUsContentUpdate, NewWhyChooseUsContentAdd, WhyChooseUsContentDelete } = req.body;

  // Retrieve the existing WebContent
  const webContent = await WebContent.findById("674efd6a7d4788194ecd519a");

  if (!webContent) {
    return next(
      new ApiResponse(400, "WebContent not found", "WebContent not found")
    );
  }

// Update WhyChooseUs content fields 
if (whyChooseUsContentUpdate && Array.isArray(whyChooseUsContentUpdate)) {
  whyChooseUsContentUpdate.forEach(({ whyChooseUsId, logo, title, reason }) => {
    if (whyChooseUsId) {
      const whyChooseUs = webContent.WhyChooseUs.id(whyChooseUsId);

      // Update fields only if they exist
      if (whyChooseUs) {
        if (logo) whyChooseUs.logo = logo;
        if (title) whyChooseUs.title = title;
        if (reason) whyChooseUs.reason = reason;
      }
    }
  });

}

// If logo, title, and reason exist, add a new WhyChooseUs object
if (NewWhyChooseUsContentAdd && Array.isArray(NewWhyChooseUsContentAdd)) {
  NewWhyChooseUsContentAdd.forEach(({ logo, title, reason }) => {
    // Add a new WhyChooseUs object only if all fields exist
    if (logo && title && reason) {
      webContent.WhyChooseUs.push({ logo, title, reason });
    }
  });
}

// If deleteobj exists, delete the WhyChooseUs object

if (Array.isArray(WhyChooseUsContentDelete) && WhyChooseUsContentDelete.length > 0) {
  WhyChooseUsContentDelete.forEach((whyChooseUsId) => {
    webContent.WhyChooseUs.pull({ _id: whyChooseUsId });
  });
}

  // Save the updated WebContent to the database

  await webContent.save();

  // Send success response
  res.status(200).json(ApiResponse(200,webContent.WhyChooseUs,"WhyChooseUs content updated successfully",true));

});

// comparison Content update,add new data and delete controller

const updateComparisonContent = asyncHandler(async (req, res, next) => {
  const { comparison } = req.body;

  // Retrieve the existing WebContent
  const webContent = await WebContent.findById("674efd6a7d4788194ecd519a");

  if (!webContent) {
    return next(
      new ApiResponse(400, "WebContent not found", "WebContent not found")
    );
  }

});

//callbooking Content update data controller

 const updateCallBookingContent = asyncHandler(async (req, res, next) => {
  const { callbooking } = req.body;

  // Retrieve the existing WebContent
  const webContent = await WebContent.findById("674efd6a7d4788194ecd519a");

  if (!webContent) {
    return next(
      new ApiResponse(400, "WebContent not found", "WebContent not found")
    );
  }

  // Update callbooking content fields
  if (callbooking) webContent.callbooking = callbooking;

  // Save the updated WebContent to the database
  await webContent.save();

  // Send success response
  res.status(200).json(ApiResponse(200,webContent.callbooking,"Call booking content updated successfully",true));
});



// FAQs Content update,add new data and delete controller

const updateFAQsContent = asyncHandler(async (req, res, next) => {
  const { FAQsContentUpdate, NewFAQsContentAdd, FAQsContentDelete } = req.body;

  // Retrieve the existing WebContent
  const webContent = await WebContent.findById("674efd6a7d4788194ecd519a");

  if (!webContent) {
    return next(
      new ApiResponse(400, "WebContent not found", "WebContent not found")
    );
  }

// Update FAQs content fields
if (FAQsContentUpdate && Array.isArray(FAQsContentUpdate)) {
  FAQsContentUpdate.forEach(({ FAQsId, FAQsQuestion, FAQsAnswer }) => {
    if (FAQsId) {
      const FAQs = webContent.FAQs.id(FAQsId);

      // Update fields only if they exist
      if (FAQs) {
        if (FAQsQuestion) FAQs.FAQsQuestion = FAQsQuestion;
        if (FAQsAnswer) FAQs.FAQsAnswer = FAQsAnswer;
      }
    }
  });
}

// If FAQsQuestion and FAQsAnswer exist, add a new FAQs object
if (NewFAQsContentAdd && Array.isArray(NewFAQsContentAdd)) {
  NewFAQsContentAdd.forEach(({ FAQsQuestion, FAQsAnswer }) => {
    // Add a new FAQs object only if both FAQsQuestion and FAQsAnswer exist
    if (FAQsQuestion && FAQsAnswer) {
      webContent.FAQs.push({ FAQsQuestion, FAQsAnswer });
    }
  });
}

// If deleteobj exists, delete the FAQs object

if (Array.isArray(FAQsContentDelete) && FAQsContentDelete.length > 0) {
  FAQsContentDelete.forEach((FAQsId) => {
    webContent.FAQs.pull({ _id: FAQsId });
  });
}

  // Save the updated WebContent to the database

  await webContent.save();

  // Send success response
  res.status(200).json(ApiResponse(200,webContent.FAQs,"FAQs content updated successfully",true));
});


const WebContentcreate = asyncHandler(async(req, res) => {
  // Create a WebContent
  let data = await WebContent.create(req.body);

  //send the response to the user
  res.status(201).json({
    status: "success",
    data: data,
    message: "WebContent created successfully",
  });

});



// Retrieve and return all WebContent from the database.

const WebContentget = asyncHandler(async(req, res) => {
  //get all the data from the database
  let data = await WebContent.findById('674efd6a7d4788194ecd519a')

  // let data1 =  data.BrandPartners.pull({ _id: '674efd6a7d4788194ecd519b' })



  //send the response to the user
  res.status(200).json({
    status: "success",
    data: data,
    message: "WebContent retrieved successfully",
  });
});

// Create and Save a new WebContent




export {updateHeroContent,updateBrandPartnersContent,updateServicesContent,updateWhyChooseUsContent,updateFAQsContent,updateCallBookingContent,WebContentcreate,WebContentget};